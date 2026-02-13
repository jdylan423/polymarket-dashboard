'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Download, Filter, Search } from 'lucide-react';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import autoTable from 'jspdf-autotable';

import type { Deal } from '@/lib/types';
import { Badge, Button, Card, CardHeader, Input, Select } from '@/components/ui';
import { DealModal } from '@/components/DealModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatMoney(n: number | null) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function roiColor(roi: number | null) {
  if (roi == null) return 'gray';
  if (roi >= 30) return 'green';
  if (roi >= 20) return 'blue';
  if (roi >= 10) return 'yellow';
  return 'red';
}

function priceRangeColor(price: number | null) {
  if (price == null) return 'gray';
  if (price < 150000) return 'pink';
  if (price <= 300000) return 'blue';
  if (price <= 600000) return 'purple';
  if (price <= 1000000) return 'yellow';
  return 'red';
}

function statusColor(status: string) {
  if (status === 'active') return 'green';
  if (status === 'sold') return 'purple';
  if (status === 'removed') return 'red';
  return 'gray';
}

export function DealsTable({ refreshMs }: { refreshMs: number }) {
  const { data, isLoading } = useSWR('/api/deals', fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: true,
  });

  const deals: Deal[] = data?.deals ?? [];

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_updated', desc: true },
  ]);

  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minRoi, setMinRoi] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [selected, setSelected] = useState<Deal | null>(null);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const d of deals) if (d.city) set.add(d.city);
    return Array.from(set).sort();
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (cityFilter && d.city !== cityFilter) return false;
      if (minRoi) {
        const n = Number(minRoi);
        if (Number.isFinite(n)) {
          if (d.roi == null || d.roi < n) return false;
        }
      }
      if (maxPrice) {
        const n = Number(maxPrice);
        if (Number.isFinite(n)) {
          if (d.price == null || d.price > n) return false;
        }
      }
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        const hay = [d.title, d.source, d.location, d.city, d.state]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deals, statusFilter, cityFilter, minRoi, maxPrice, globalFilter]);

  const columns = useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        header: 'Deal',
        accessorKey: 'title',
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="min-w-[260px]">
              <div className="text-xs font-semibold text-mc-text">
                {d.title ?? 'Untitled'}
              </div>
              <div className="text-[11px] text-mc-text-secondary mt-1 flex flex-wrap gap-2">
                <span>{d.source}</span>
                <span>•</span>
                <span>{[d.city, d.state].filter(Boolean).join(', ') || d.location || 'Unknown'}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Price',
        accessorKey: 'price',
        sortingFn: 'basic',
        cell: ({ row }) => {
          const p = row.original.price;
          return (
            <div className="flex items-center justify-end gap-2">
              <Badge color={priceRangeColor(p)}>
                {p == null ? 'N/A' : p < 150000 ? '<150k' : p <= 300000 ? '150–300k' : p <= 600000 ? '300–600k' : p <= 1000000 ? '600k–1M' : '>1M'}
              </Badge>
              <span className="text-xs tabular-nums">{formatMoney(p)}</span>
            </div>
          );
        },
      },
      {
        header: 'ROI',
        accessorKey: 'roi',
        sortingFn: 'basic',
        cell: ({ row }) => {
          const roi = row.original.roi;
          return (
            <div className="flex items-center justify-end gap-2">
              <Badge color={roiColor(roi)}>{formatPct(roi)}</Badge>
            </div>
          );
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge color={statusColor(row.original.status)}>{row.original.status}</Badge>
          </div>
        ),
      },
      {
        header: 'Updated',
        id: 'last_updated',
        accessorFn: (d) => {
          // SQLite timestamps are stored as text; ensure stable numeric sort
          const t = Date.parse(d.last_updated);
          return Number.isFinite(t) ? t : 0;
        },
        cell: ({ row }) => (
          <div className="text-[11px] text-mc-text-secondary tabular-nums text-right min-w-[150px]">
            {row.original.last_updated}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredDeals,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  function exportPdf() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(12);
    doc.text('Laundromat Deals Export', 14, 12);

    const rows = table.getRowModel().rows.map((r) => {
      const d = r.original;
      return [
        d.title ?? 'Untitled',
        d.source,
        [d.city, d.state].filter(Boolean).join(', '),
        d.price ?? '',
        d.roi ?? '',
        d.status,
        d.url ?? '',
      ];
    });

    autoTable(doc, {
      head: [['Title', 'Source', 'Location', 'Price', 'ROI', 'Status', 'URL']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 27, 34] },
      alternateRowStyles: { fillColor: [13, 17, 23] },
      theme: 'striped',
      margin: { top: 16 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    doc.save('deals.pdf');
  }

  return (
    <Card>
      <CardHeader
        title={`Deals ${isLoading ? '(loading...)' : `(${filteredDeals.length}/${deals.length})`}`}
        right={
          <div className="flex items-center gap-2">
            <Button onClick={exportPdf} disabled={!deals.length} className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5" /> Export PDF
            </Button>
          </div>
        }
      />

      <div className="p-4 border-b border-mc-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div className="md:col-span-2">
            <div className="text-[11px] text-mc-text-secondary mb-1 flex items-center gap-2">
              <Search className="h-3.5 w-3.5" /> Search
            </div>
            <Input value={globalFilter} onChange={setGlobalFilter} placeholder="title, city, state, source..." />
          </div>
          <div>
            <div className="text-[11px] text-mc-text-secondary mb-1 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" /> Status
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All' },
                { value: 'active', label: 'active' },
                { value: 'sold', label: 'sold' },
                { value: 'removed', label: 'removed' },
              ]}
            />
          </div>
          <div>
            <div className="text-[11px] text-mc-text-secondary mb-1">City</div>
            <Select
              value={cityFilter}
              onChange={setCityFilter}
              options={[{ value: '', label: 'All' }, ...cities.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-mc-text-secondary mb-1">Min ROI %</div>
              <Input value={minRoi} onChange={setMinRoi} placeholder="20" type="number" />
            </div>
            <div>
              <div className="text-[11px] text-mc-text-secondary mb-1">Max price</div>
              <Input value={maxPrice} onChange={setMaxPrice} placeholder="1500000" type="number" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-mc-bg-secondary sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="text-left px-3 py-2 border-b border-mc-border text-[11px] text-mc-text-secondary font-medium select-none"
                  >
                    {h.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-1 hover:text-mc-text"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[h.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-mc-border hover:bg-mc-bg-tertiary/40 cursor-pointer"
                onClick={() => setSelected(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!table.getRowModel().rows.length ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-mc-text-secondary">
                  No deals match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? <DealModal deal={selected} onClose={() => setSelected(null)} /> : null}
    </Card>
  );
}
