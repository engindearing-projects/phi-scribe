// Audit log per 45 CFR § 164.312(b) — metadata only, no PHI text stored
// Stored as NDJSON at ~/.phi-scribe/audit.ndjson — no native deps required.

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface AuditEntry {
  timestamp: string;
  eventType: 'transcription_started' | 'transcription_completed' | 'note_generated' | 'note_copied' | 'note_edited';
  modelId: string;
  modelType: 'local' | 'cloud';
  durationSeconds?: number;
  wordCount?: number;
  sessionId: string;
}

function getLogPath(): string {
  return process.env.AUDIT_LOG_PATH ?? path.join(os.homedir(), '.phi-scribe', 'audit.ndjson');
}

function ensureDir(logPath: string) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
}

export function logAuditEvent(entry: AuditEntry): void {
  try {
    const logPath = getLogPath();
    ensureDir(logPath);
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    // Audit log failure must not crash the app
    console.error('[audit] Failed to write event:', err);
  }
}

export function getRecentAuditEvents(limit = 50): AuditEntry[] {
  try {
    const logPath = getLogPath();
    if (!fs.existsSync(logPath)) return [];
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    return lines
      .slice(-limit)
      .reverse()
      .map((l) => JSON.parse(l) as AuditEntry);
  } catch {
    return [];
  }
}
