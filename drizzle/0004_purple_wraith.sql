ALTER TABLE "containers" ADD COLUMN "arrived_at_port" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "arrived_at_warehouse" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shipment_notification_subscribers" ADD COLUMN "notified_port_arrived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shipment_notification_subscribers" ADD COLUMN "notified_warehouse_arrived" boolean DEFAULT false NOT NULL;