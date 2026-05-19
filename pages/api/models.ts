import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchOllamaModels, LOCAL_MODELS, CLOUD_MODELS } from '@/lib/ollama';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const installedModels = await fetchOllamaModels();
  const ollamaAvailable = installedModels.length > 0;

  // Mark local models as available/unavailable based on what Ollama reports
  const localModels = LOCAL_MODELS.map((m) => ({
    ...m,
    available: installedModels.some((name) => name.startsWith(m.id.split(':')[0])),
  }));

  // If Ollama is unreachable, mark all local as unavailable but don't hide them
  res.status(200).json({
    ollamaAvailable,
    installedModels,
    localModels,
    cloudModels: CLOUD_MODELS,
  });
}
