import 'server-only';
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

export interface PaystackInit {
  authorizationUrl: string;
  reference: string;
}

/** Initializes a Paystack transaction; returns the hosted checkout URL. */
export async function initializeTransaction(input: {
  email: string;
  amount: number; // pesewas
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInit> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: 'GHS',
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? 'Paystack init failed');
  }
  return {
    authorizationUrl: json.data.authorization_url as string,
    reference: json.data.reference as string,
  };
}

export interface PaystackVerification {
  status: string; // 'success' | 'failed' | 'abandoned' ...
  reference: string;
  amount: number;
}

/** Verifies a transaction by reference (callback-page fallback). */
export async function verifyTransaction(
  reference: string
): Promise<PaystackVerification> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } }
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? 'Paystack verify failed');
  }
  return {
    status: json.data.status as string,
    reference: json.data.reference as string,
    amount: json.data.amount as number,
  };
}

/** Verifies the x-paystack-signature HMAC of a raw webhook body. */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
