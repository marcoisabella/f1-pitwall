interface TeamActionsProps {
  onSave: () => void;
  onOptimize: () => void;
  canSave: boolean;
  saving: boolean;
  optimizing: boolean;
}

export function TeamActions({ onSave, onOptimize, canSave, saving, optimizing }: TeamActionsProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onSave}
        disabled={!canSave || saving}
        className="w-full py-2 rounded font-[var(--font-display)] font-semibold text-sm tracking-wider transition-colors bg-f1-green/90 hover:bg-f1-green text-f1-bg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'SAVING...' : 'SAVE TEAM'}
      </button>
      <button
        onClick={onOptimize}
        disabled={optimizing}
        className="w-full py-2 rounded font-[var(--font-display)] font-semibold text-sm tracking-wider transition-colors bg-f1-purple/90 hover:bg-f1-purple text-white disabled:opacity-40"
      >
        {optimizing ? 'OPTIMIZING...' : 'AI OPTIMIZE'}
      </button>
    </div>
  );
}
