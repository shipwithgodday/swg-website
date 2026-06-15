import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

// A variant axis, e.g. { name: 'Size', values: ['S','M','L'] }. A product
// carries 0–2 of these; variants are the cartesian product of their values.
export const productOptionSchema = z.object({
  name: z.string().trim().min(1, 'Option name is required'),
  values: z
    .array(z.string().trim().min(1))
    .min(1, 'Each option needs at least one value'),
});

export const productOptionsSchema = z
  .array(productOptionSchema)
  .max(2, 'A product can have at most two options');

export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Variant name is required'),
  // SKUs are generated server-side, never accepted from the client.
  optionValues: z.array(z.string()).optional(),
  price: z.number().int().nonnegative('Price must be 0 or more'),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().nonnegative('Stock must be 0 or more'),
});

export const productImageInputSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url(),
  publicId: z.string().min(1),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean(),
  isPreorder: z.boolean(),
  preorderShipEstimate: z
    .string()
    .trim()
    .max(120, 'Ship estimate is too long')
    .nullable()
    .optional(),
  options: productOptionsSchema.default([]),
  variants: z
    .array(variantInputSchema)
    .min(1, 'A product needs at least one variant'),
  images: z.array(productImageInputSchema).default([]),
});

export type ProductImageInput = z.infer<typeof productImageInputSchema>;

export type ProductOptionInput = z.infer<typeof productOptionSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;

export const customerEditSchema = z.object({
  name: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().min(1).optional().nullable(),
});

export type CustomerEditInput = z.infer<typeof customerEditSchema>;

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .nullable(),
  phone: z.string().trim().min(1).optional().nullable(),
  // Optional: blank string is normalised to undefined and the action auto-
  // assigns the next GD mark.
  shippingMark: z
    .string()
    .trim()
    .min(1)
    .max(32, 'Shipping mark is too long')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
