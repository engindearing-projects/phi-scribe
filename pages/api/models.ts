import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchOllamaModels, LOCAL_MODELS, CLOUD_MODELS, OllamaModel } from '@/lib/ollama';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const installedModels = await fetchOllamaModels();
  const ollamaAvailable = installedModels.length > 0;

  // Mark known local models as available/unavailable
  const localModels = LOCAL_MODELS.map((m) => ({
    ...m,
    available: installedModels.some((name) => name.startsWith(m.id.split(':')[0])),
  }));

  // Surface installed models not in LOCAL_MODELS so any pulled model works in the picker
  const knownIds = new Set(LOCAL_MODELS.map((m) => m.id.split(':')[0]));
  const extraModels: (OllamaModel & { available: boolean })[] = installedModels
    .filter((name) => !knownIds.has(name.split(':')[0]))
    .map((name) => ({
      id: name,
      label: name,
      type: 'local' as const,
      available: true,
    }));

  res.status(200).json({
    ollamaAvailable,
    installedModels,
    localModels: [...localModels, ...extraModels],
    cloudModels: CLOUD_MODELS,
  });
}
