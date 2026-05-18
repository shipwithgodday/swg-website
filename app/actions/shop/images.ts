'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import {
  createUploadSignature,
  destroyImage,
  type UploadSignature,
} from '@/lib/cloudinary';
import type { ActionResult } from './categories';

export async function getUploadSignature(): Promise<UploadSignature> {
  await requireAdmin();
  return createUploadSignature();
}

export async function addProductImage(input: {
  productId: string;
  url: string;
  publicId: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(eq(productImages.productId, input.productId));
  await db.insert(productImages).values({
    productId: input.productId,
    url: input.url,
    publicId: input.publicId,
    position: existing.length,
  });
  revalidatePath(`/admin/products/${input.productId}`);
  return { ok: true };
}

export async function deleteProductImage(
  imageId: string
): Promise<ActionResult> {
  await requireAdmin();
  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId));
  if (!image) return { ok: false, error: 'Image not found.' };
  await destroyImage(image.publicId);
  await db.delete(productImages).where(eq(productImages.id, imageId));
  revalidatePath(`/admin/products/${image.productId}`);
  return { ok: true };
}
