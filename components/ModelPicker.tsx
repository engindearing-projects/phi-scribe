import * as Select from '@radix-ui/react-select';
import * as Separator from '@radix-ui/react-separator';
import { ChevronDown, Lock, Server, Cloud } from 'lucide-react';

export interface SelectedModel {
  id: string;
  label: string;
  type: 'local' | 'cloud';
  provider?: 'openai' | 'anthropic';
}

interface ModelOption extends SelectedModel {
  available?: boolean;
}

interface ModelPickerProps {
  localModels: ModelOption[];
  cloudModels: ModelOption[];
  selected: SelectedModel;
  onSelect: (model: SelectedModel) => void;
  baaConfirmed: boolean;
  ollamaAvailable: boolean;
}

export default function ModelPicker({
  localModels,
  cloudModels,
  selected,
  onSelect,
  baaConfirmed,
  ollamaAvailable,
}: ModelPickerProps) {
  const handleValueChange = (value: string) => {
    const local = localModels.find((m) => m.id === value);
    if (local) { onSelect(local); return; }
    const cloud = cloudModels.find((m) => m.id === value);
    if (cloud) onSelect(cloud);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Model</label>
      <Select.Root value={selected.id} onValueChange={handleValueChange}>
        <Select.Trigger
          className="flex items-center justify-between w-full px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Select model"
        >
          <span className="flex items-center gap-2">
            {selected.type === 'local' ? <Server className="w-3.5 h-3.5 text-green-500" /> : <Cloud className="w-3.5 h-3.5 text-blue-500" />}
            {selected.label}
          </span>
          <Select.Icon>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className="z-50 overflow-hidden bg-popover border border-border rounded-md shadow-lg">
            <Select.Viewport className="p-1">
              {/* Local models */}
              <Select.Group>
                <Select.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Server className="w-3 h-3" />
                  Local (Ollama)
                  {!ollamaAvailable && (
                    <span className="ml-1 text-xs text-amber-500">(Ollama not running)</span>
                  )}
                </Select.Label>
                {localModels.map((m) => (
                  <Select.Item
                    key={m.id}
                    value={m.id}
                    disabled={!m.available}
                    className={[
                      'relative flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none',
                      m.available
                        ? 'hover:bg-accent data-[highlighted]:bg-accent'
                        : 'opacity-40 cursor-not-allowed',
                    ].join(' ')}
                  >
                    <Select.ItemText>{m.label}</Select.ItemText>
                    {!m.available && (
                      <span className="ml-auto text-xs text-muted-foreground">not installed</span>
                    )}
                  </Select.Item>
                ))}
              </Select.Group>

              <Separator.Root className="my-1 h-px bg-border" />

              {/* Cloud models — greyed out unless BAA confirmed */}
              <Select.Group>
                <Select.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Cloud className="w-3 h-3" />
                  Cloud
                  {!baaConfirmed && (
                    <span className="ml-1 flex items-center gap-0.5 text-xs text-amber-500">
                      <Lock className="w-3 h-3" /> BAA required
                    </span>
                  )}
                </Select.Label>
                {cloudModels.map((m) => (
                  <Select.Item
                    key={m.id}
                    value={m.id}
                    disabled={!baaConfirmed}
                    className={[
                      'relative flex items-center gap-2 px-2 py-1.5 text-sm rounded outline-none',
                      baaConfirmed
                        ? 'cursor-pointer hover:bg-accent data-[highlighted]:bg-accent'
                        : 'opacity-40 cursor-not-allowed',
                    ].join(' ')}
                  >
                    <Select.ItemText>{m.label}</Select.ItemText>
                  </Select.Item>
                ))}
                {!baaConfirmed && (
                  <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                    Confirm BAA in Settings to unlock cloud models.
                  </p>
                )}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
