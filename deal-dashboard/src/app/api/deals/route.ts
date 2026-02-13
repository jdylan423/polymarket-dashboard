import { NextResponse } from 'next/server';
import { listDeals } from '@/lib/deals';

export const dynamic = 'force-dynamic';

function toNum(v: string | null) {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const deals = listDeals({
    q: searchParams.get('q') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    state: searchParams.get('state') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    minRoi: toNum(searchParams.get('minRoi')),
    maxRoi: toNum(searchParams.get('maxRoi')),
    minPrice: toNum(searchParams.get('minPrice')),
    maxPrice: toNum(searchParams.get('maxPrice')),
  });

  return NextResponse.json({ deals });
}
