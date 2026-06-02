ALTER TABLE "delivery_zones" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "delivery_zones" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "delivery_fee";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "delivery_zone_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "ship_region";