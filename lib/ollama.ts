export interface OllamaModel {
  id: string;
  label: string;
  type: 'local';
}

export interface CloudModel {
  id: string;
  label: string;
  type: 'cloud';
  provider: 'openai' | 'anthropic';
  requiresBaa: true;
}

export type Model = OllamaModel | CloudModel;

export const LOCAL_MODELS: OllamaModel[] = [
  { id: 'llama3.1:8b', label: 'Llama 3.1 8B (default)', type: 'local' },
  { id: 'mistral:7b', label: 'Mistral 7B', type: 'local' },
  { id: 'phi3.5', label: 'Phi-3.5', type: 'local' },
  { id: 'qwen2.5:7b', label: 'Qwen 2.5 7B', type: 'local' },
  { id: 'llama3.1:70b', label: 'Llama 3.1 70B', type: 'local' },
  { id: 'gemma4:26b', label: 'Gemma 4 26B', type: 'local' },
  { id: 'gemma2:9b', label: 'Gemma 2 9B', type: 'local' },
  { id: 'phi3:mini', label: 'Phi-3 Mini', type: 'local' },
  { id: 'phi3:medium', label: 'Phi-3 Medium', type: 'local' },
  { id: 'mistral-nemo:12b', label: 'Mistral Nemo 12B', type: 'local' },
];

export const CLOUD_MODELS: CloudModel[] = [
  { id: 'gpt-4o', label: 'GPT-4o (requires BAA)', type: 'cloud', provider: 'openai', requiresBaa: true },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (requires BAA)', type: 'cloud', provider: 'openai', requiresBaa: true },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet (requires BAA)', type: 'cloud', provider: 'anthropic', requiresBaa: true },
  { id: 'claude-opus-4-7', label: 'Claude Opus (requires BAA)', type: 'cloud', provider: 'anthropic', requiresBaa: true },
];

export const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';

export async function fetchOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json() as { models?: Array<{ name: string }> };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

export interface GenerateOptions {
  model: string;
  prompt: string;
  systemPrompt?: string;
  ollamaUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export async function generateWithOllama(options: GenerateOptions): Promise<string> {
  const base = options.ollamaUrl ?? OLLAMA_BASE_URL;
  const messages = [
    ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
    { role: 'user', content: options.prompt },
  ];

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}

export async function generateWithOpenAI(options: GenerateOptions): Promise<string> {
  const messages = [
    ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
    { role: 'user', content: options.prompt },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.openaiApiKey}`,
    },
    body: JSON.stringify({ model: options.model, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}

export async function generateWithAnthropic(options: GenerateOptions): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': options.anthropicApiKey ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: 2048,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [{ role: 'user', content: options.prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${text}`);
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content.find((c) => c.type === 'text')?.text ?? '';
}
