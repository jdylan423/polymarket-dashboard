import { NextResponse } from 'next/server';
import { getStats } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = getStats();
  return NextResponse.json({ stats });
}
