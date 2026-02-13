import { Building2, RefreshCcw } from 'lucide-react';

export function Header({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <header className="border-b border-mc-border bg-mc-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-mc-bg-tertiary border border-mc-border flex items-center justify-center">
            <Building2 className="h-4 w-4 text-mc-accent" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Deal Dashboard</div>
            <div className="text-xs text-mc-text-secondary">
              Laundromat deal pipeline • SQLite live view
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-mc-text-secondary">
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Auto-refresh supported</span>
          {right}
        </div>
      </div>
    </header>
  );
}
