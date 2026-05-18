'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
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
    await db.batch([
      db
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
        .where(eq(products.id, id)),
      db.delete(productVariants).where(eq(productVariants.productId, id)),
      db.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId: id,
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
    console.error('updateProduct failed:', error);
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
