import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export type RecorderState = 'idle' | 'recording' | 'processing';

interface RecorderProps {
  onTranscript: (transcript: string) => void;
  onError: (message: string) => void;
  sessionId: string;
  whisperModel?: string;
}

export default function Recorder({ onTranscript, onError, sessionId, whisperModel = 'base' }: RecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current!);
        setState('processing');

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('model', whisperModel);
        formData.append('sessionId', sessionId);

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json() as { transcript?: string; error?: string };
          if (!res.ok) throw new Error(data.error ?? 'Transcription failed');
          onTranscript(data.transcript ?? '');
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Transcription failed');
        } finally {
          setState('idle');
          setElapsed(0);
        }
      };

      mr.start(1000);
      mediaRef.current = mr;
      setElapsed(0);
      setState('recording');
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      onError('Microphone access denied. Please allow microphone access and try again.');
    }
  }, [whisperModel, sessionId, onTranscript, onError]);

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={state === 'recording' ? stopRecording : startRecording}
        disabled={state === 'processing'}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
        className={[
          'relative flex items-center justify-center w-20 h-20 rounded-full transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50',
          state === 'recording'
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse-ring shadow-lg shadow-red-500/40'
            : state === 'processing'
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg',
        ].join(' ')}
      >
        {state === 'processing' ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : state === 'recording' ? (
          <MicOff className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>

      <div className="text-sm text-muted-foreground min-h-[1.25rem]">
        {state === 'recording' && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording {formatTime(elapsed)}
          </span>
        )}
        {state === 'processing' && 'Transcribing…'}
        {state === 'idle' && 'Tap to begin dictation'}
      </div>
    </div>
  );
}
