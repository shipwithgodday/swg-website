import { NextRequest, NextResponse } from 'next/server';
import { isValidOrderNumber } from '@/lib/shop/order-number';
import { getPublicOrderStatusByNumber } from '@/lib/shop/public-order';

/**
 * Public, no-auth order-status lookup for the /track page. Returns only the
 * privacy-limited payload (status, items, shipping mark) — never delivery
 * details. Mirrors the `{ found: boolean }` contract of /api/track.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('orderNumber') ?? '';
  const orderNumber = raw.trim().toUpperCase();

  if (!isValidOrderNumber(orderNumber)) {
    return NextResponse.json({ found: false });
  }

  const order = await getPublicOrderStatusByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, ...order });
}
