import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { transcribeAudio, type WhisperModel } from '@/lib/whisper';
import { logAuditEvent } from '@/lib/audit';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phi-scribe-audio-'));
  const form = formidable({ uploadDir: tmpDir, keepExtensions: true, maxFileSize: 50 * 1024 * 1024 });

  try {
    const [fields, files] = await form.parse(req);
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!audioFile) return res.status(400).json({ error: 'No audio file provided' });

    const model = (Array.isArray(fields.model) ? fields.model[0] : fields.model ?? 'base') as WhisperModel;
    const sessionId = (Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId) ?? 'unknown';

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'transcription_started',
      modelId: `whisper-${model}`,
      modelType: 'local',
      sessionId,
    });

    const result = await transcribeAudio({ audioPath: audioFile.filepath, model });

    // Delete audio immediately after transcription (privacy default)
    fs.unlinkSync(audioFile.filepath);
    fs.rmdirSync(tmpDir, { recursive: true });

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'transcription_completed',
      modelId: `whisper-${model}`,
      modelType: 'local',
      durationSeconds: result.durationSeconds,
      wordCount: result.transcript.split(/\s+/).filter(Boolean).length,
      sessionId,
    });

    res.status(200).json({ transcript: result.transcript, durationSeconds: result.durationSeconds });
  } catch (err) {
    // Best-effort cleanup
    try { fs.rmdirSync(tmpDir, { recursive: true }); } catch {}
    console.error('[transcribe]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Transcription failed' });
  }
}
