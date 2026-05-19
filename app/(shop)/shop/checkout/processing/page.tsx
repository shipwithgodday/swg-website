import { redirect } from 'next/navigation';
import Container from '@/components/shared/container';
import { verifyTransaction } from '@/lib/shop/paystack';
import { getOrderByNumber } from '@/lib/shop/orders';

export const metadata = { title: 'Processing payment' };

export default async function ProcessingPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;

  if (reference) {
    let verified = false;
    try {
      const v = await verifyTransaction(reference);
      const result = await getOrderByNumber(reference);
      verified = !!result && v.status === 'success';
    } catch {
      verified = false;
    }
    if (verified) redirect(`/shop/orders/${reference}`);
  }

  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Confirming your payment…</h1>
      <p className="mt-3 text-muted-foreground">
        This can take a moment. Your order will appear under{' '}
        <a href="/shop/orders" className="text-primary underline">
          My orders
        </a>{' '}
        once payment is confirmed.
      </p>
    </Container>
  );
}
