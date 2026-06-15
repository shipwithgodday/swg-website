import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/shop/auth';
import { getAdjustmentLog } from '@/lib/shipment/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const log = await getAdjustmentLog(id);
  return NextResponse.json(log);
}
