'use client';

import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { Header } from '@/components/Header';
import { DealsTable } from '@/components/DealsTable';
import { StatsPanel } from '@/components/StatsPanel';
import { Button, Select } from '@/components/ui';

export function Dashboard() {
  const { mutate } = useSWRConfig();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [interval, setInterval] = useState('30000');

  const refreshMs = useMemo(() => {
    if (!autoRefresh) return 0;
    const n = Number(interval);
    return Number.isFinite(n) ? n : 30000;
  }, [autoRefresh, interval]);

  function refreshNow() {
    void mutate('/api/deals');
    void mutate('/api/stats');
  }

  return (
    <div className="min-h-screen">
      <Header
        right={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto
            </label>
            <Select
              value={interval}
              onChange={setInterval}
              options={[
                { value: '5000', label: '5s' },
                { value: '15000', label: '15s' },
                { value: '30000', label: '30s' },
                { value: '60000', label: '60s' },
              ]}
              className="py-1"
            />
            <Button onClick={refreshNow} className="py-1">
              Refresh
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <StatsPanel refreshMs={refreshMs} />
        <DealsTable refreshMs={refreshMs} />
        <div className="text-[11px] text-mc-text-secondary">
          Tip: run the scraper in <code className="text-mc-text">tools/deal-pipeline</code> and this dashboard will pick up DB changes.
        </div>
      </main>
    </div>
  );
}
