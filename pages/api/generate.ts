import type { NextApiRequest, NextApiResponse } from 'next';
import { buildSoapPrompt, type SoapVariant } from '@/lib/soap-prompt';
import { generateWithOllama, generateWithOpenAI, generateWithAnthropic } from '@/lib/ollama';
import { logAuditEvent } from '@/lib/audit';

interface GenerateRequest {
  transcript: string;
  modelId: string;
  modelType: 'local' | 'cloud';
  provider?: 'openai' | 'anthropic';
  soapVariant?: SoapVariant;
  baaConfirmed?: boolean;
  sessionId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body as GenerateRequest;
  const { transcript, modelId, modelType, provider, soapVariant = 'standard', baaConfirmed = false, sessionId } = body;

  if (!transcript?.trim()) return res.status(400).json({ error: 'Transcript is required' });
  if (!modelId) return res.status(400).json({ error: 'modelId is required' });

  // BAA gate — cloud models are hard-blocked unless baaConfirmed is explicitly set
  if (modelType === 'cloud' && !baaConfirmed) {
    return res.status(403).json({
      error: 'BAA confirmation required before sending data to cloud LLMs. Enable the BAA confirmation toggle in Settings.',
    });
  }

  const start = Date.now();
  const prompt = buildSoapPrompt(transcript, soapVariant);

  try {
    let note: string;

    if (modelType === 'local') {
      note = await generateWithOllama({ model: modelId, prompt });
    } else if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
      note = await generateWithOpenAI({ model: modelId, prompt, openaiApiKey: apiKey });
    } else if (provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
      note = await generateWithAnthropic({ model: modelId, prompt, anthropicApiKey: apiKey });
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    const durationSeconds = (Date.now() - start) / 1000;

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'note_generated',
      modelId,
      modelType,
      durationSeconds,
      wordCount: note.split(/\s+/).filter(Boolean).length,
      sessionId,
    });

    res.status(200).json({ note, durationSeconds });
  } catch (err) {
    console.error('[generate]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Generation failed' });
  }
}
