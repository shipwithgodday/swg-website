'use server';
import { requireAdmin } from '@/lib/shop/auth';
import {
  createUploadSignature,
  destroyImage,
  type UploadSignature,
} from '@/lib/cloudinary';
import type { ActionResult } from './categories';

/** Returns a signature for a browser-side signed Cloudinary upload. */
export async function getUploadSignature(): Promise<UploadSignature> {
  await requireAdmin();
  return createUploadSignature();
}

/**
 * Removes uploaded-but-unsaved Cloudinary assets. Called when a product
 * create/edit is cancelled or fails so no orphaned images are left behind.
 */
export async function discardUploads(
  publicIds: string[]
): Promise<ActionResult> {
  await requireAdmin();
  await Promise.all(publicIds.map((id) => destroyImage(id)));
  return { ok: true };
}
