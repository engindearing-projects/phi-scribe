import { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

interface NoteEditorProps {
  note: string;
  onCopy?: () => void;
  onReset?: () => void;
}

export default function NoteEditor({ note, onCopy, onReset }: NoteEditorProps) {
  const [edited, setEdited] = useState(note);
  const [copied, setCopied] = useState(false);

  // Sync when a new note comes in
  useEffect(() => { setEdited(note); }, [note]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(edited);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">SOAP Note</h2>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-input rounded hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              New
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy to EHR'}
          </button>
        </div>
      </div>

      <textarea
        value={edited}
        onChange={(e) => setEdited(e.target.value)}
        className="w-full min-h-[320px] p-3 text-sm font-mono bg-background border border-input rounded-md resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        spellCheck={true}
        aria-label="SOAP note editor"
      />

      <p className="text-xs text-muted-foreground">
        Review and edit before copying. phi-scribe does not send this note anywhere.
      </p>
    </div>
  );
}
