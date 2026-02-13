'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Download, Plus, Save, Trash2, Upload } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  annualize,
  asPercent,
  computeDeal,
  dollars0,
  dollars2,
  pct1,
  projectCashFlows,
  years1,
  type DealInput,
  type DealResult,
} from '@/lib/investmentCalculator';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Mode = 'single' | 'compare';

type Scenario = {
  id: string;
  name: string;
  savedAt: string;
  mode: Mode;
  deals: DealInput[];
};

const LS_KEY = 'laundroCalc.scenarios.v1';

function uid() {
  return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function DealEditor({
  deal,
  onChange,
  onRemove,
  canRemove,
}: {
  deal: DealInput;
  onChange: (next: DealInput) => void;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  return (
    <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-mc-text-secondary">Deal</div>
        {canRemove && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs px-2 py-1 rounded border border-mc-border hover:bg-mc-bg-tertiary text-mc-text-secondary inline-flex items-center gap-1"
            title="Remove deal"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-mc-text-secondary">Name</span>
          <input
            value={deal.name}
            onChange={(e) => onChange({ ...deal, name: e.target.value })}
            className="bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm outline-none focus:border-mc-accent"
            placeholder="Main St"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-mc-text-secondary">Asking price</span>
            <input
              inputMode="decimal"
              value={String(deal.askingPrice)}
              onChange={(e) => onChange({ ...deal, askingPrice: parseNumber(e.target.value) })}
              className="bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm outline-none focus:border-mc-accent"
              placeholder="300000"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-mc-text-secondary">Down payment %</span>
            <input
              inputMode="decimal"
              value={String(Math.round(deal.downPaymentPct * 1000) / 10)}
              onChange={(e) => onChange({ ...deal, downPaymentPct: asPercent(parseNumber(e.target.value)) })}
              className="bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm outline-none focus:border-mc-accent"
              placeholder="30"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-mc-text-secondary">Monthly revenue</span>
            <input
              inputMode="decimal"
              value={String(deal.monthlyRevenue)}
              onChange={(e) => onChange({ ...deal, monthlyRevenue: parseNumber(e.target.value) })}
              className="bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm outline-none focus:border-mc-accent"
              placeholder="25000"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-mc-text-secondary">Monthly expenses</span>
            <input
              inputMode="decimal"
              value={String(deal.monthlyExpenses)}
              onChange={(e) => onChange({ ...deal, monthlyExpenses: parseNumber(e.target.value) })}
              className="bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm outline-none focus:border-mc-accent"
              placeholder="18000"
            />
          </label>
        </div>

        <p className="text-[11px] text-mc-text-secondary leading-relaxed">
          Note: this calculator uses the same simplified NOI logic as the CLI—no debt service is modeled. If you want loan
          payments included, add them into monthly expenses.
        </p>
      </div>
    </div>
  );
}

function RecoBadge({ reco }: { reco: DealResult['recommendation'] }) {
  const cls =
    reco === 'BUY (strong)'
      ? 'bg-mc-accent-green/20 text-mc-accent-green border-mc-accent-green/40'
      : reco === 'CONSIDER'
        ? 'bg-mc-accent-yellow/20 text-mc-accent-yellow border-mc-accent-yellow/40'
        : reco.includes('negative')
          ? 'bg-mc-accent-red/20 text-mc-accent-red border-mc-accent-red/40'
          : 'bg-mc-bg-tertiary text-mc-text-secondary border-mc-border';

  return <span className={clsx('text-xs px-2 py-1 rounded border', cls)}>{reco}</span>;
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="text-xs text-mc-text-secondary">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function DealResultsCard({ deal }: { deal: DealResult }) {
  return (
    <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{deal.name}</div>
          <div className="text-xs text-mc-text-secondary">{dollars0(deal.askingPrice)} • Down {pct1(deal.downPaymentPct)}</div>
        </div>
        <RecoBadge reco={deal.recommendation} />
      </div>

      <div className="mt-3 border-t border-mc-border/70 pt-2">
        <MetricRow label="Cash invested (est.)" value={dollars0(deal.cashInvested)} />
        <MetricRow label="Revenue / mo" value={dollars2(deal.monthlyRevenue)} />
        <MetricRow label="Expenses / mo" value={dollars2(deal.monthlyExpenses)} />
        <MetricRow label="Cash flow / mo" value={dollars2(deal.monthlyCashFlow)} />
        <MetricRow label="Cash flow / yr (NOI)" value={dollars2(deal.annualCashFlow)} />
        <MetricRow label="Cap rate" value={pct1(deal.capRate)} />
        <MetricRow label="Cash-on-cash ROI" value={pct1(deal.cashOnCashRoi)} />
        <MetricRow
          label="Payback"
          value={deal.paybackPeriodYears === Number.POSITIVE_INFINITY ? '—' : years1(deal.paybackPeriodYears)}
        />
      </div>
    </div>
  );
}

function ExportPdfButton({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const node = targetRef.current;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0d1117',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // image dims
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => {
        img.onload = () => res(true);
        img.onerror = rej;
      });

      const imgW = img.width;
      const imgH = img.height;

      const scale = Math.min(pageW / imgW, pageH / imgH);
      const renderW = imgW * scale;
      const renderH = imgH * scale;

      // If tall, do simple multi-page slicing
      if (renderH <= pageH) {
        pdf.addImage(dataUrl, 'PNG', (pageW - renderW) / 2, 20, renderW, renderH);
      } else {
        // Draw at native scale into multiple pages by shifting Y
        const pxPerPt = imgW / pageW;
        const sliceHeightPx = Math.floor((pageH - 40) * pxPerPt);

        let y = 0;
        let page = 0;
        while (y < imgH) {
          if (page > 0) pdf.addPage();
          // create a canvas slice
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) break;
          canvas.width = imgW;
          canvas.height = Math.min(sliceHeightPx, imgH - y);
          ctx.fillStyle = '#0d1117';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, -y);
          const sliceUrl = canvas.toDataURL('image/png');

          const sliceHpt = canvas.height / pxPerPt;
          pdf.addImage(sliceUrl, 'PNG', 0, 20, pageW, sliceHpt);

          y += canvas.height;
          page++;
        }
      }

      pdf.save('laundromat-deal-calculations.pdf');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      disabled={busy}
      className={clsx(
        'text-xs px-3 py-2 rounded border border-mc-border hover:bg-mc-bg-tertiary inline-flex items-center gap-2',
        busy && 'opacity-60 cursor-not-allowed'
      )}
    >
      <Download className="h-4 w-4" />
      {busy ? 'Exporting…' : 'Export to PDF'}
    </button>
  );
}

export function Dashboard() {
  const [mode, setMode] = useState<Mode>('single');
  const [mounted, setMounted] = useState(false);
  const [deals, setDeals] = useState<DealInput[]>([
    { name: 'Deal 1', askingPrice: 300000, monthlyRevenue: 25000, monthlyExpenses: 18000, downPaymentPct: 0.3 },
  ]);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // load scenarios
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Scenario[];
      if (Array.isArray(parsed)) setScenarios(parsed);
    } catch {
      // ignore
    }
  }, []);

  function persist(next: Scenario[]) {
    setScenarios(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  const results: DealResult[] = useMemo(() => {
    return deals.map((d) => computeDeal(d));
  }, [deals]);

  const maxDeals = 4;

  const combinedMonthly = useMemo(() => {
    const months = 36;
    const series = results.map((r) => ({ name: r.name, points: projectCashFlows({ monthlyCashFlow: r.monthlyCashFlow, months }) }));

    // recharts wants a single array of objects with keys per deal
    const rows = Array.from({ length: months }, (_, idx) => {
      const base: Record<string, number | string> = { month: `M${idx + 1}` };
      for (const s of series) {
        base[s.name] = s.points[idx]?.cumulativeCashFlow ?? 0;
      }
      return base;
    });
    return rows;
  }, [results]);

  const annualRows = useMemo(() => {
    const years = 5;
    const months = years * 12;
    const series = results.map((r) => ({
      name: r.name,
      years: annualize(projectCashFlows({ monthlyCashFlow: r.monthlyCashFlow, months })),
    }));

    const rows = Array.from({ length: years }, (_, idx) => {
      const base: Record<string, number | string> = { year: `Y${idx + 1}` };
      for (const s of series) {
        base[s.name] = s.years[idx]?.cumulativeCashFlow ?? 0;
      }
      return base;
    });

    return rows;
  }, [results]);

  const palette = ['#58a6ff', '#3fb950', '#a371f7', '#db61a2'];

  const metricBars = useMemo(() => {
    return results.map((r) => ({
      name: r.name,
      annualCashFlow: r.annualCashFlow,
      capRatePct: Number.isFinite(r.capRate) ? r.capRate * 100 : 0,
      cocPct: Number.isFinite(r.cashOnCashRoi) ? r.cashOnCashRoi * 100 : 0,
      paybackYears: Number.isFinite(r.paybackPeriodYears) ? r.paybackPeriodYears : 0,
    }));
  }, [results]);

  function setDeal(idx: number, next: DealInput) {
    setDeals((prev) => prev.map((d, i) => (i === idx ? next : d)));
  }

  function addDeal() {
    setDeals((prev) => {
      if (prev.length >= maxDeals) return prev;
      const n = prev.length + 1;
      return [...prev, { name: `Deal ${n}`, askingPrice: 0, monthlyRevenue: 0, monthlyExpenses: 0, downPaymentPct: 0.3 }];
    });
  }

  function removeDeal(idx: number) {
    setDeals((prev) => prev.filter((_, i) => i !== idx));
  }

  function applyMode(nextMode: Mode) {
    setMode(nextMode);
    setDeals((prev) => {
      if (nextMode === 'single') return prev.slice(0, 1);
      // compare: at least 2 deals
      if (prev.length >= 2) return prev;
      return [
        prev[0] ?? { name: 'Deal 1', askingPrice: 0, monthlyRevenue: 0, monthlyExpenses: 0, downPaymentPct: 0.3 },
        { name: 'Deal 2', askingPrice: 0, monthlyRevenue: 0, monthlyExpenses: 0, downPaymentPct: 0.3 },
      ];
    });
  }

  function saveScenario() {
    const name = scenarioName.trim();
    if (!name) return;
    const next: Scenario = { id: uid(), name, savedAt: new Date().toISOString(), mode, deals };
    persist([next, ...scenarios]);
    setScenarioName('');
  }

  function loadScenario(id: string) {
    const s = scenarios.find((x) => x.id === id);
    if (!s) return;
    setMode(s.mode);
    setDeals(s.deals);
  }

  function deleteScenario(id: string) {
    persist(scenarios.filter((s) => s.id !== id));
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-mc-border bg-mc-bg/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Laundromat Deal Calculator</div>
            <div className="text-xs text-mc-text-secondary">Single deal evaluation + side-by-side comparisons</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded border border-mc-border overflow-hidden">
              <button
                type="button"
                onClick={() => applyMode('single')}
                className={clsx(
                  'text-xs px-3 py-2 border-r border-mc-border',
                  mode === 'single' ? 'bg-mc-bg-tertiary text-mc-text' : 'bg-mc-bg text-mc-text-secondary hover:bg-mc-bg-tertiary'
                )}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => applyMode('compare')}
                className={clsx(
                  'text-xs px-3 py-2',
                  mode === 'compare' ? 'bg-mc-bg-tertiary text-mc-text' : 'bg-mc-bg text-mc-text-secondary hover:bg-mc-bg-tertiary'
                )}
              >
                Compare
              </button>
            </div>

            <ExportPdfButton targetRef={exportRef} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 space-y-4">
          <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Inputs</div>
                <div className="text-xs text-mc-text-secondary">
                  {mode === 'single' ? 'Evaluate one deal' : 'Compare 2–4 deals'}
                </div>
              </div>

              {mode === 'compare' ? (
                <button
                  type="button"
                  onClick={addDeal}
                  disabled={deals.length >= maxDeals}
                  className={clsx(
                    'text-xs px-2 py-1 rounded border border-mc-border hover:bg-mc-bg-tertiary inline-flex items-center gap-1',
                    deals.length >= maxDeals && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {deals.map((deal, idx) => (
              <DealEditor
                key={idx}
                deal={deal}
                onChange={(next) => setDeal(idx, next)}
                canRemove={mode === 'compare' && deals.length > 2}
                onRemove={() => removeDeal(idx)}
              />
            ))}
          </div>

          <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
            <div className="text-sm font-semibold">Save / Load</div>
            <div className="mt-3 flex gap-2">
              <input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario name (e.g. Feb shortlist)"
                className="flex-1 bg-mc-bg border border-mc-border rounded px-3 py-2 text-sm outline-none focus:border-mc-accent"
              />
              <button
                type="button"
                onClick={saveScenario}
                className="text-xs px-3 py-2 rounded border border-mc-border hover:bg-mc-bg-tertiary inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-auto pr-1">
              {scenarios.length === 0 ? (
                <div className="text-xs text-mc-text-secondary">No saved scenarios yet (stored in this browser only).</div>
              ) : (
                scenarios.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 border border-mc-border rounded px-2 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{s.name}</div>
                      <div className="text-[11px] text-mc-text-secondary truncate">
                        {s.mode} • {s.deals.length} deal{s.deals.length === 1 ? '' : 's'} • {new Date(s.savedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadScenario(s.id)}
                        className="text-xs px-2 py-1 rounded border border-mc-border hover:bg-mc-bg-tertiary inline-flex items-center gap-1"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteScenario(s.id)}
                        className="text-xs px-2 py-1 rounded border border-mc-border hover:bg-mc-bg-tertiary text-mc-text-secondary"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6" ref={exportRef}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Results</div>
              <div className="text-xs text-mc-text-secondary">
                {mode === 'single' ? 'Deal snapshot + projections' : 'Compare metrics and projections side-by-side'}
              </div>
            </div>
          </div>

          <div className={clsx('grid gap-4', mode === 'single' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
            {results.map((r) => (
              <DealResultsCard key={r.name} deal={r} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
              <div className="text-sm font-semibold">Metrics (bar)</div>
              <div className="mt-3 h-72">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricBars} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' }}
                    />
                    <Legend wrapperStyle={{ color: '#8b949e', fontSize: 11 }} />
                    <Bar dataKey="annualCashFlow" fill="#58a6ff" name="Annual CF" />
                    <Bar dataKey="capRatePct" fill="#3fb950" name="Cap %" />
                    <Bar dataKey="cocPct" fill="#a371f7" name="CoC %" />
                    <Bar dataKey="paybackYears" fill="#d29922" name="Payback (yrs)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center text-xs text-mc-text-secondary">Loading chart…</div>
                )}
              </div>
              <div className="text-[11px] text-mc-text-secondary mt-2">
                Tip: cap/coC bars are shown in % units; payback is years.
              </div>
            </div>

            <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
              <div className="text-sm font-semibold">Cumulative cash flow (36 months)</div>
              <div className="mt-3 h-72">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedMonthly} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: '#8b949e', fontSize: 11 }} interval={5} />
                    <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' }}
                    />
                    <Legend wrapperStyle={{ color: '#8b949e', fontSize: 11 }} />
                    {results.map((r, idx) => (
                      <Line
                        key={r.name}
                        type="monotone"
                        dataKey={r.name}
                        stroke={palette[idx % palette.length]}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center text-xs text-mc-text-secondary">Loading chart…</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-mc-bg-secondary border border-mc-border rounded-lg p-4">
            <div className="text-sm font-semibold">Cash flow projection (annual, 5 years)</div>
            <div className="mt-3 h-80">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={annualRows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fill: '#8b949e', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' }} />
                  <Legend wrapperStyle={{ color: '#8b949e', fontSize: 11 }} />
                  {results.map((r, idx) => (
                    <Line
                      key={r.name}
                      type="monotone"
                      dataKey={r.name}
                      stroke={palette[idx % palette.length]}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-xs text-mc-text-secondary">Loading chart…</div>
              )}
            </div>
            <div className="text-[11px] text-mc-text-secondary mt-2">Lines show cumulative cash flow by year.</div>
          </div>
        </section>
      </main>

      <footer className="border-t border-mc-border mt-6">
        <div className="max-w-7xl mx-auto px-4 py-4 text-[11px] text-mc-text-secondary">
          Built with Next.js + Tailwind + Recharts. Calculator logic matches the CLI in tools/investment-calculator.
        </div>
      </footer>
    </div>
  );
}
