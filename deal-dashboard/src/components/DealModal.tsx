'use client';

import { X, ExternalLink, Phone, Mail, User, Building } from 'lucide-react';
import type { Deal } from '@/lib/types';
import { Badge, Button, Card } from '@/components/ui';

function formatMoney(n: number | null) {
  if (n == null || !Number.isFinite(n)) return 'N/A';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return 'N/A';
  return `${n.toFixed(1)}%`;
}

function statusColor(status: string) {
  if (status === 'active') return 'green';
  if (status === 'sold') return 'purple';
  if (status === 'removed') return 'red';
  return 'gray';
}

export function DealModal({
  deal,
  onClose,
}: {
  deal: Deal;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-[min(920px,calc(100vw-24px))] max-h-[calc(100vh-24px)] overflow-auto animate-slide-in">
        <Card className="shadow-xl">
          <div className="px-4 py-3 border-b border-mc-border flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{deal.title ?? 'Untitled deal'}</div>
              <div className="text-xs text-mc-text-secondary mt-1 flex flex-wrap items-center gap-2">
                <span>{deal.source}</span>
                <span>•</span>
                <span>{[deal.city, deal.state].filter(Boolean).join(', ') || deal.location || 'Unknown'}</span>
                <span>•</span>
                <Badge color={statusColor(deal.status)}>{deal.status}</Badge>
              </div>
            </div>
            <Button onClick={onClose} className="px-2 py-2">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary">Price</div>
                  <div className="text-sm font-semibold mt-1">{formatMoney(deal.price)}</div>
                </div>
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary">ROI</div>
                  <div className="text-sm font-semibold mt-1">{formatPct(deal.roi)}</div>
                </div>
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary">Cash Flow</div>
                  <div className="text-sm font-semibold mt-1">{formatMoney(deal.cash_flow)}</div>
                </div>
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary">Gross Income</div>
                  <div className="text-sm font-semibold mt-1">{formatMoney(deal.gross_income)}</div>
                </div>
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary">First Seen</div>
                  <div className="text-sm font-semibold mt-1">{deal.first_seen}</div>
                </div>
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary">Last Updated</div>
                  <div className="text-sm font-semibold mt-1">{deal.last_updated}</div>
                </div>
              </div>

              <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                <div className="text-[11px] text-mc-text-secondary">Description</div>
                <div className="text-xs leading-relaxed mt-2 whitespace-pre-wrap">
                  {deal.description || 'No description.'}
                </div>
              </div>

              {deal.url ? (
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-mc-accent hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View listing
                </a>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                <div className="text-[11px] text-mc-text-secondary mb-2">Contact</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span>{deal.contact_name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span>{deal.contact_phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span className="break-all">{deal.contact_email || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                <div className="text-[11px] text-mc-text-secondary mb-2">Broker</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span>{deal.broker_company || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span>{deal.broker_name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span>{deal.broker_phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-mc-text-secondary" />
                    <span className="break-all">{deal.broker_email || '—'}</span>
                  </div>
                </div>
              </div>

              {deal.metadata ? (
                <div className="bg-mc-bg-tertiary border border-mc-border rounded p-3">
                  <div className="text-[11px] text-mc-text-secondary mb-2">Metadata</div>
                  <pre className="text-[11px] overflow-auto whitespace-pre-wrap text-mc-text-secondary">
                    {JSON.stringify(deal.metadata, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
