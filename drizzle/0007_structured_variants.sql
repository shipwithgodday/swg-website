ALTER TABLE "product_variants" ADD COLUMN "option_values" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "options" jsonb DEFAULT '[]'::jsonb NOT NULL;