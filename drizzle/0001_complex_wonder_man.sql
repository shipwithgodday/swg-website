ALTER TABLE "order_items" ADD COLUMN "is_preorder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "preorder_ship_estimate" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_preorder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preorder_ship_estimate" text;