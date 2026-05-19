import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { baaConfirmed } = req.body as { baaConfirmed?: boolean };

  const cookie = serialize('phi-scribe-baa', baaConfirmed ? 'true' : 'false', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ ok: true });
}
