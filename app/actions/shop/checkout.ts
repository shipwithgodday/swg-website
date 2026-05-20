'use server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { inArray, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  productVariants,
  products,
  deliveryZones,
  orders,
  orderItems,
} from '@/lib/db/schema';
import { generateOrderNumber } from '@/lib/shop/order-number';
import {
  resolveCustomerId,
  resolveGuestCustomer,
} from '@/lib/shop/customer';
import { initializeTransaction } from '@/lib/shop/paystack';

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'Your cart is empty'),
  deliveryZoneId: z.string().uuid(),
  shipName: z.string().trim().min(1, 'Name is required'),
  shipPhone: z.string().trim().min(1, 'Phone is required'),
  shipAddress: z.string().trim().min(1, 'Address is required'),
  shipCity: z.string().trim().min(1, 'City is required'),
  // Required only for guest checkout — signed-in users get their email from
  // the Clerk session instead.
  shipEmail: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional(),
});

export type CheckoutResult =
  | { ok: true; authorizationUrl: string }
  | { ok: false; error: string };

export async function createCheckout(
  raw: unknown
): Promise<CheckoutResult> {
  const { userId } = await auth();

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const input = parsed.data;

  // Guests must supply an email on the form so we have somewhere to send the
  // order confirmation; signed-in users get theirs from Clerk below.
  if (!userId && !input.shipEmail) {
    return {
      ok: false,
      error: 'Enter an email so we can send your order confirmation.',
    };
  }

  // Load the variants referenced by the cart, with their product.
  const variantIds = input.items.map((i) => i.variantId);
  const rows = await db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      price: productVariants.price,
      stock: productVariants.stockQuantity,
      productName: products.name,
      productStatus: products.status,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const byId = new Map(rows.map((r) => [r.variantId, r]));

  // Validate every cart line.
  const lineItems: {
    variantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
  }[] = [];
  for (const item of input.items) {
    const v = byId.get(item.variantId);
    if (!v || v.productStatus !== 'active') {
      return {
        ok: false,
        error: 'An item in your cart is no longer available.',
      };
    }
    if (v.stock < item.quantity) {
      return {
        ok: false,
        error: `Not enough stock for ${v.productName} (${v.variantName}).`,
      };
    }
    lineItems.push({
      variantId: v.variantId,
      productName: v.productName,
      variantName: v.variantName,
      unitPrice: v.price,
      quantity: item.quantity,
    });
  }

  // Delivery zone.
  const [zone] = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.id, input.deliveryZoneId));
  if (!zone || !zone.active) {
    return { ok: false, error: 'Select a valid delivery region.' };
  }

  const subtotal = lineItems.reduce(
    (s, l) => s + l.unitPrice * l.quantity,
    0
  );
  const total = subtotal + zone.fee;

  // Resolve the customer (and allocate a shipping mark if new). Signed-in
  // users go through `resolveCustomerId` (which may link an imported row to
  // their Clerk account); guests go through `resolveGuestCustomer` which
  // skips the Clerk step but uses the same email/phone match logic so a
  // future sign-up with the same email picks up the order history.
  let customerId: string;
  let email: string;
  if (userId) {
    const user = await currentUser();
    const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? null;
    if (!clerkEmail) {
      return {
        ok: false,
        error: 'Your account has no email address for the receipt.',
      };
    }
    email = clerkEmail;
    customerId = await resolveCustomerId({
      clerkUserId: userId,
      email,
      phone: input.shipPhone,
      name: input.shipName,
    });
  } else {
    // Guard above ensures shipEmail is present.
    email = input.shipEmail as string;
    customerId = await resolveGuestCustomer({
      email,
      phone: input.shipPhone,
      name: input.shipName,
    });
  }

  // Create the pending order + items atomically.
  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();
  try {
    await db.batch([
      db.insert(orders).values({
        id: orderId,
        orderNumber,
        customerId,
        status: 'pending',
        subtotal,
        deliveryFee: zone.fee,
        total,
        deliveryZoneId: zone.id,
        shipName: input.shipName,
        shipPhone: input.shipPhone,
        shipAddress: input.shipAddress,
        shipCity: input.shipCity,
        shipRegion: zone.name,
        paystackReference: orderNumber,
      }),
      db.insert(orderItems).values(
        lineItems.map((l) => ({
          orderId,
          variantId: l.variantId,
          productName: l.productName,
          variantName: l.variantName,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        }))
      ),
    ]);
  } catch (error) {
    console.error('createCheckout: order insert failed', error);
    return { ok: false, error: 'Could not create your order.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('createCheckout: NEXT_PUBLIC_SITE_URL is not set');
    return {
      ok: false,
      error: 'Checkout is not configured. Please contact support.',
    };
  }

  // Initialize Paystack.
  try {
    const init = await initializeTransaction({
      email,
      amount: total,
      reference: orderNumber,
      callbackUrl: `${siteUrl}/shop/checkout/processing`,
    });
    return { ok: true, authorizationUrl: init.authorizationUrl };
  } catch (error) {
    console.error('createCheckout: Paystack init failed', error);
    return {
      ok: false,
      error: 'Could not start payment. Please try again.',
    };
  }
}
