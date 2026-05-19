import { useState, useEffect, useCallback, useRef } from 'react';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import Recorder from '@/components/Recorder';
import TranscriptView from '@/components/TranscriptView';
import ModelPicker, { type SelectedModel } from '@/components/ModelPicker';
import NoteEditor from '@/components/NoteEditor';
import { AlertCircle, Loader2 } from 'lucide-react';
import { LOCAL_MODELS, CLOUD_MODELS } from '@/lib/ollama';
import type { SoapVariant } from '@/lib/soap-prompt';

interface ModelData {
  ollamaAvailable: boolean;
  localModels: Array<SelectedModel & { available?: boolean }>;
  cloudModels: Array<SelectedModel & { available?: boolean }>;
}

interface Props {
  initialModels: ModelData;
  baaConfirmed: boolean;
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Home({ initialModels, baaConfirmed }: Props) {
  const sessionId = useRef(generateSessionId()).current;
  const [models, setModels] = useState<ModelData>(initialModels);
  const [selected, setSelected] = useState<SelectedModel>(
    initialModels.localModels.find((m) => m.available) ?? initialModels.localModels[0]
  );
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [soapVariant] = useState<SoapVariant>('standard');

  // Refresh model availability on mount (SSR data may be stale)
  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data: ModelData) => {
        setModels(data);
        // Re-pick default if current selection is now unavailable
        const current = data.localModels.find((m) => m.id === selected.id);
        if (current && !current.available) {
          const fallback = data.localModels.find((m) => m.available);
          if (fallback) setSelected(fallback);
        }
      })
      .catch(() => {/* non-critical */});
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTranscript = useCallback(async (text: string) => {
    setTranscript(text);
    setError('');
    if (!text.trim()) return;

    setGenerating(true);
    setNote('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          modelId: selected.id,
          modelType: selected.type,
          provider: selected.provider,
          soapVariant,
          baaConfirmed,
          sessionId,
        }),
      });
      const data = await res.json() as { note?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setNote(data.note ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate note');
    } finally {
      setGenerating(false);
    }
  }, [selected, soapVariant, baaConfirmed, sessionId]);

  const handleCopied = useCallback(() => {
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType: 'note_copied',
        modelId: selected.id,
        modelType: selected.type,
        sessionId,
      }),
    }).catch(() => {/* non-critical */});
  }, [selected, sessionId]);

  const handleReset = useCallback(() => {
    setTranscript('');
    setNote('');
    setError('');
  }, []);

  const phase: 'idle' | 'transcript' | 'generating' | 'note' =
    note ? 'note' : generating ? 'generating' : transcript ? 'transcript' : 'idle';

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">phi-scribe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dictate → SOAP note. Runs locally. Audio stays on your machine.
          </p>
        </div>

        {/* Model picker */}
        <ModelPicker
          localModels={models.localModels}
          cloudModels={models.cloudModels}
          selected={selected}
          onSelect={setSelected}
          baaConfirmed={baaConfirmed}
          ollamaAvailable={models.ollamaAvailable}
        />

        {/* Recorder */}
        <div className="flex justify-center py-4">
          <Recorder
            onTranscript={handleTranscript}
            onError={setError}
            sessionId={sessionId}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Transcript */}
        {(phase === 'transcript' || phase === 'generating' || phase === 'note') && (
          <TranscriptView transcript={transcript} onChange={setTranscript} />
        )}

        {/* Generating spinner */}
        {generating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating note with {selected.label}…
          </div>
        )}

        {/* Note */}
        {note && !generating && (
          <NoteEditor note={note} onCopy={handleCopied} onReset={handleReset} />
        )}

        {/* Idle hint */}
        {phase === 'idle' && !error && (
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Press the mic button and dictate your encounter notes.</p>
            <p>phi-scribe transcribes locally with Whisper, then generates a structured SOAP note.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Read BAA confirmation from cookie (set in Settings)
  const baaConfirmed = ctx.req.cookies['phi-scribe-baa'] === 'true';

  // Build initial model list — mark all local unavailable (client refreshes on mount)
  const localModels = LOCAL_MODELS.map((m) => ({ ...m, available: false }));

  return {
    props: {
      initialModels: {
        ollamaAvailable: false,
        localModels,
        cloudModels: CLOUD_MODELS,
      },
      baaConfirmed,
    },
  };
};
