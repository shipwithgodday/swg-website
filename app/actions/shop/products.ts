'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, productVariants } from '@/lib/db/schema';
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
  try {
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(products)
        .values({
          name: p.name,
          slug: slugify(p.name),
          description: p.description ?? null,
          categoryId: p.categoryId ?? null,
          status: p.status,
          featured: p.featured,
        })
        .returning({ id: products.id });
      await tx.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId: created.id,
          name: v.name,
          sku: v.sku ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity,
          position: i,
        }))
      );
    });
  } catch {
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
    await db.transaction(async (tx) => {
      await tx
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
      await tx
        .delete(productVariants)
        .where(eq(productVariants.productId, id));
      await tx.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId: id,
          name: v.name,
          sku: v.sku ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity,
          position: i,
        }))
      );
    });
  } catch {
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
