'use server';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { products, productVariants, orderItems } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { slugify } from '@/lib/shop/slug';
import { productInputSchema } from '@/lib/shop/validation';
import type { ActionResult } from './categories';

export async function createProduct(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const p = parsed.data;
  const productId = randomUUID();
  try {
    await db.batch([
      db.insert(products).values({
        id: productId,
        name: p.name,
        slug: slugify(p.name),
        description: p.description ?? null,
        categoryId: p.categoryId ?? null,
        status: p.status,
        featured: p.featured,
      }),
      db.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId,
          name: v.name,
          sku: v.sku ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity,
          position: i,
        }))
      ),
    ]);
  } catch (error) {
    console.error('createProduct failed:', error);
    return {
      ok: false,
      error: 'Could not save — a product or SKU with this name may exist.',
    };
  }
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function updateProduct(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const p = parsed.data;

  try {
    const existing = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, id));
    const existingIds = new Set(existing.map((v) => v.id));
    const submittedIds = new Set(
      p.variants.map((v) => v.id).filter((v): v is string => !!v)
    );

    const removed = [...existingIds].filter(
      (vid) => !submittedIds.has(vid)
    );
    let deletable: string[] = [];
    if (removed.length) {
      const referenced = await db
        .select({ variantId: orderItems.variantId })
        .from(orderItems)
        .where(inArray(orderItems.variantId, removed));
      const referencedIds = new Set(
        referenced.map((r) => r.variantId)
      );
      deletable = removed.filter((vid) => !referencedIds.has(vid));
    }

    const productUpdate = db
      .update(products)
      .set({
        name: p.name,
        slug: slugify(p.name),
        description: p.description ?? null,
        categoryId: p.categoryId ?? null,
        status: p.status,
        featured: p.featured,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    const rest = [];
    for (const vid of deletable) {
      rest.push(
        db.delete(productVariants).where(eq(productVariants.id, vid))
      );
    }
    p.variants.forEach((v, i) => {
      if (v.id && existingIds.has(v.id)) {
        rest.push(
          db
            .update(productVariants)
            .set({
              name: v.name,
              sku: v.sku ?? null,
              price: v.price,
              compareAtPrice: v.compareAtPrice ?? null,
              stockQuantity: v.stockQuantity,
              position: i,
            })
            .where(eq(productVariants.id, v.id))
        );
      } else {
        rest.push(
          db.insert(productVariants).values({
            productId: id,
            name: v.name,
            sku: v.sku ?? null,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            stockQuantity: v.stockQuantity,
            position: i,
          })
        );
      }
    });

    await db.batch([productUpdate, ...rest]);
  } catch (error) {
    console.error('updateProduct failed', error);
    return { ok: false, error: 'Could not save the product.' };
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/admin/products');
  return { ok: true };
}
