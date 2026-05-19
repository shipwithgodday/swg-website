'use server';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import {
  products,
  productVariants,
  productImages,
  orderItems,
} from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { destroyImage } from '@/lib/cloudinary';
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
    const imageInsert = p.images.length
      ? [
          db.insert(productImages).values(
            p.images.map((img, i) => ({
              productId,
              url: img.url,
              publicId: img.publicId,
              position: i,
            }))
          ),
        ]
      : [];
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
      ...imageInsert,
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

    // Reconcile images: keep submitted rows, delete the rest.
    const currentImages = await db
      .select({ id: productImages.id, publicId: productImages.publicId })
      .from(productImages)
      .where(eq(productImages.productId, id));
    const submittedImageIds = new Set(
      p.images.map((img) => img.id).filter((v): v is string => !!v)
    );
    const removedImages = currentImages.filter(
      (img) => !submittedImageIds.has(img.id)
    );
    for (const img of removedImages) {
      rest.push(db.delete(productImages).where(eq(productImages.id, img.id)));
    }
    p.images.forEach((img, i) => {
      if (img.id) {
        rest.push(
          db
            .update(productImages)
            .set({ position: i })
            .where(eq(productImages.id, img.id))
        );
      } else {
        rest.push(
          db.insert(productImages).values({
            productId: id,
            url: img.url,
            publicId: img.publicId,
            position: i,
          })
        );
      }
    });

    await db.batch([productUpdate, ...rest]);

    // Drop the Cloudinary assets for images removed from the product.
    await Promise.all(
      removedImages.map((img) => destroyImage(img.publicId))
    );
  } catch (error) {
    console.error('updateProduct failed', error);
    return { ok: false, error: 'Could not save the product.' };
  }

  revalidatePath('/admin/products');
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  const images = await db
    .select({ publicId: productImages.publicId })
    .from(productImages)
    .where(eq(productImages.productId, id));
  try {
    await db.delete(products).where(eq(products.id, id));
  } catch (error) {
    console.error('deleteProduct failed', error);
    return {
      ok: false,
      error:
        'Could not delete — this product has variants used in existing orders. Archive it instead.',
    };
  }
  await Promise.all(images.map((img) => destroyImage(img.publicId)));
  revalidatePath('/admin/products');
  return { ok: true };
}
