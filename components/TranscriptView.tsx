import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TranscriptViewProps {
  transcript: string;
  onChange?: (value: string) => void;
}

export default function TranscriptView({ transcript, onChange }: TranscriptViewProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-input rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>Transcript</span>
        {expanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
      </button>

      {expanded && (
        <textarea
          value={transcript}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          className="w-full p-3 text-sm bg-background resize-y min-h-[80px] max-h-[200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Transcript will appear here after recording…"
          aria-label="Transcript"
        />
      )}
    </div>
  );
}
