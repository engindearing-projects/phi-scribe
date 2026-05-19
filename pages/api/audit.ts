import type { NextApiRequest, NextApiResponse } from 'next';
import { logAuditEvent, getRecentAuditEvents, type AuditEntry } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const entry = req.body as AuditEntry;
    logAuditEvent(entry);
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'GET') {
    const limit = parseInt((req.query.limit as string) ?? '50', 10);
    return res.status(200).json({ events: getRecentAuditEvents(limit) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
