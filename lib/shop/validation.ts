import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const variantInputSchema = z.object({
  name: z.string().trim().min(1, 'Variant name is required'),
  sku: z.string().trim().optional().nullable(),
  price: z.number().int().nonnegative('Price must be 0 or more'),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().nonnegative('Stock must be 0 or more'),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean(),
  variants: z
    .array(variantInputSchema)
    .min(1, 'A product needs at least one variant'),
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;

export const customerEditSchema = z.object({
  name: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().min(1).optional().nullable(),
});

export type CustomerEditInput = z.infer<typeof customerEditSchema>;

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  fee: z.number().int().nonnegative('Fee must be 0 or more'),
  active: z.boolean(),
});

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
