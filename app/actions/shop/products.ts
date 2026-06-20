'use server';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm';
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
import { assignSkus } from '@/lib/shop/sku';
import type { VariantInput } from '@/lib/shop/validation';
import type { ActionResult } from './categories';

/** Ordered option values for a variant, or [] for a single default variant. */
function variantOptionValues(v: VariantInput): string[] {
  return v.optionValues ?? [];
}

/**
 * Persisted display name: the option-value combination for a real variant, or
 * an empty string for a simple (option-less) product, which carries no label.
 */
function variantName(v: VariantInput): string {
  const values = variantOptionValues(v);
  return values.length ? values.join(' / ') : '';
}

/** Null for default variants; the value array otherwise. */
function variantOptionColumn(v: VariantInput): string[] | null {
  const values = variantOptionValues(v);
  return values.length ? values : null;
}

/**
 * Every SKU used by *other* products — seed for collision-free generation so
 * we never violate the global `product_variants.sku` unique constraint.
 */
async function takenSkusExcluding(productId?: string): Promise<Set<string>> {
  const rows = await db
    .select({ sku: productVariants.sku })
    .from(productVariants)
    .where(
      productId
        ? and(
            isNotNull(productVariants.sku),
            ne(productVariants.productId, productId)
          )
        : isNotNull(productVariants.sku)
    );
  return new Set(rows.map((r) => r.sku).filter((s): s is string => !!s));
}

export async function createProduct(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const p = parsed.data;
  const productId = randomUUID();
  try {
    const skus = assignSkus(
      p.name,
      p.variants.map((v) => ({ optionValues: variantOptionValues(v) })),
      await takenSkusExcluding()
    );
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
        isPreorder: p.isPreorder,
        preorderShipEstimate: p.isPreorder
          ? (p.preorderShipEstimate ?? null)
          : null,
        options: p.options,
      }),
      db.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId,
          name: variantName(v),
          sku: skus[i],
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity,
          position: i,
          optionValues: variantOptionColumn(v),
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
  revalidatePath('/swg-admin/products');
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
      .select({ id: productVariants.id, sku: productVariants.sku })
      .from(productVariants)
      .where(eq(productVariants.productId, id));
    const existingIds = new Set(existing.map((v) => v.id));
    const existingSkuById = new Map(existing.map((v) => [v.id, v.sku]));
    const submittedIds = new Set(
      p.variants.map((v) => v.id).filter((v): v is string => !!v)
    );

    // Preserve SKUs of variants that already exist; generate fresh,
    // collision-free SKUs for new variants.
    const skus = assignSkus(
      p.name,
      p.variants.map((v) => ({
        optionValues: variantOptionValues(v),
        existingSku:
          v.id && existingIds.has(v.id)
            ? (existingSkuById.get(v.id) ?? undefined)
            : undefined,
      })),
      await takenSkusExcluding(id)
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
        isPreorder: p.isPreorder,
        preorderShipEstimate: p.isPreorder
          ? (p.preorderShipEstimate ?? null)
          : null,
        options: p.options,
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
              name: variantName(v),
              sku: skus[i],
              price: v.price,
              compareAtPrice: v.compareAtPrice ?? null,
              stockQuantity: v.stockQuantity,
              position: i,
              optionValues: variantOptionColumn(v),
            })
            .where(eq(productVariants.id, v.id))
        );
      } else {
        rest.push(
          db.insert(productVariants).values({
            productId: id,
            name: variantName(v),
            sku: skus[i],
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            stockQuantity: v.stockQuantity,
            position: i,
            optionValues: variantOptionColumn(v),
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

  revalidatePath('/swg-admin/products');
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
  revalidatePath('/swg-admin/products');
  return { ok: true };
}
