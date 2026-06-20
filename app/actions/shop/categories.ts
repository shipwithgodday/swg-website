'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { slugify } from '@/lib/shop/slug';
import { categoryInputSchema } from '@/lib/shop/validation';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createCategory(
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, description, imageUrl } = parsed.data;
  try {
    await db.insert(categories).values({
      name,
      slug: slugify(name),
      description: description ?? null,
      imageUrl: imageUrl ?? null,
    });
  } catch {
    return { ok: false, error: 'A category with this name already exists.' };
  }
  revalidatePath('/swg-admin/categories');
  return { ok: true };
}

export async function updateCategory(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, description, imageUrl } = parsed.data;
  try {
    await db
      .update(categories)
      .set({
        name,
        slug: slugify(name),
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  } catch {
    return { ok: false, error: 'A category with this name already exists.' };
  }
  revalidatePath('/swg-admin/categories');
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath('/swg-admin/categories');
  return { ok: true };
}
