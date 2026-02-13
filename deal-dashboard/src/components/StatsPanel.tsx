'use client';

import useSWR from 'swr';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatMoney(v: number | null) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatPct(v: number | null) {
  if (v == null) return '—';
  return `${v.toFixed(1)}%`;
}

export function StatsPanel({ refreshMs }: { refreshMs: number }) {
  const { data } = useSWR('/api/stats', fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: true,
  });

  const stats = data?.stats;
  const buckets = stats?.priceBuckets ?? [];

  return (
    <Card>
      <CardHeader title="Stats" />
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
          <div className="text-[11px] text-mc-text-secondary">Total deals</div>
          <div className="text-sm font-semibold mt-1">{stats?.totalDeals ?? '—'}</div>
        </div>
        <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
          <div className="text-[11px] text-mc-text-secondary">Active</div>
          <div className="text-sm font-semibold mt-1">{stats?.activeDeals ?? '—'}</div>
        </div>
        <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
          <div className="text-[11px] text-mc-text-secondary">Avg ROI</div>
          <div className="text-sm font-semibold mt-1">{formatPct(stats?.avgRoi ?? null)}</div>
        </div>
        <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
          <div className="text-[11px] text-mc-text-secondary">Avg price</div>
          <div className="text-sm font-semibold mt-1">{formatMoney(stats?.avgPrice ?? null)}</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="text-xs text-mc-text-secondary mb-2">Price distribution</div>
        <div className="h-52 bg-mc-bg-tertiary border border-mc-border rounded p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#8b949e', fontSize: 10 }} interval={0} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  color: '#c9d1d9',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#58a6ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[11px] text-mc-text-secondary mt-2">
          Updated last 24h: <span className="text-mc-text">{stats?.updatedLast24h ?? '—'}</span>
        </div>
      </div>
    </Card>
  );
}
