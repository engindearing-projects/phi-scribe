import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'turbo';

export interface TranscribeOptions {
  audioPath: string;
  model?: WhisperModel;
  language?: string;
}

export interface TranscribeResult {
  transcript: string;
  durationSeconds: number;
}

// Locate whisper.cpp binary — check common install paths
function findWhisperBin(): string {
  const candidates = [
    process.env.WHISPER_BIN,
    path.join(os.homedir(), 'whisper.cpp', 'build', 'bin', 'whisper-cli'),
    path.join(os.homedir(), 'whisper.cpp', 'main'),
    '/usr/local/bin/whisper-cli',
    '/opt/homebrew/bin/whisper-cli',
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Fall back to PATH (also covers `pip install openai-whisper` CLI)
  return 'whisper';
}

// Locate whisper model file
function findModelPath(model: WhisperModel): string {
  if (process.env.WHISPER_MODEL_PATH) return process.env.WHISPER_MODEL_PATH;

  const candidates = [
    path.join(os.homedir(), 'whisper.cpp', 'models', `ggml-${model}.bin`),
    path.join(os.homedir(), '.cache', 'whisper', `ggml-${model}.bin`),
    `/usr/local/share/whisper/ggml-${model}.bin`,
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return '';
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const start = Date.now();
  const model = options.model ?? 'base';
  const bin = findWhisperBin();
  const modelPath = findModelPath(model);

  let transcript: string;

  // Try whisper.cpp binary first (fast, local, no Python)
  if (modelPath && bin !== 'whisper') {
    const tmpOut = path.join(os.tmpdir(), `phi-scribe-${Date.now()}`);
    const cmd = `"${bin}" -m "${modelPath}" -f "${options.audioPath}" -otxt -of "${tmpOut}" --no-prints`;
    await execAsync(cmd, { timeout: 60_000 });
    const outFile = `${tmpOut}.txt`;
    transcript = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8').trim() : '';
    fs.existsSync(outFile) && fs.unlinkSync(outFile);
  } else {
    // Fall back to openai-whisper Python CLI
    const langFlag = options.language ? `--language ${options.language}` : '';
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phi-scribe-'));
    const cmd = `whisper "${options.audioPath}" --model ${model} ${langFlag} --output_dir "${tmpDir}" --output_format txt --fp16 False`;
    await execAsync(cmd, { timeout: 120_000 });
    const basename = path.basename(options.audioPath, path.extname(options.audioPath));
    const outFile = path.join(tmpDir, `${basename}.txt`);
    transcript = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8').trim() : '';
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const durationSeconds = (Date.now() - start) / 1000;
  return { transcript, durationSeconds };
}
