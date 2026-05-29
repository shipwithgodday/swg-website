import { NextRequest, NextResponse } from 'next/server';
import { resolveInvoice } from '@/lib/shipment/queries';
import { maskEmail } from '@/lib/shipment/maskEmail';

export async function GET(req: NextRequest) {
  const invoice = req.nextUrl.searchParams.get('invoice');
  if (!invoice?.trim()) {
    return NextResponse.json({ found: false });
  }

  const resolved = await resolveInvoice(invoice.trim());

  if (!resolved || !resolved.container) {
    return NextResponse.json({ found: false });
  }

  const { container, customer } = resolved;

  return NextResponse.json({
    found: true,
    invoiceNumber: invoice.toUpperCase().trim(),
    containerNumber: resolved.containerNumber,
    customer: customer
      ? {
          name: customer.name,
          hasEmail: !!customer.email,
          maskedEmail: customer.email ? maskEmail(customer.email) : null,
        }
      : null,
    etaPort: container.etaPort?.toISOString() ?? null,
    etaWarehouse: container.etaWarehouse?.toISOString() ?? null,
    arrivedAtPort: container.arrivedAtPort?.toISOString() ?? null,
    arrivedAtWarehouse: container.arrivedAtWarehouse?.toISOString() ?? null,
  });
}
