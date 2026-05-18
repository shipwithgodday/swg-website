import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
