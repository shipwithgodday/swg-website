CREATE TABLE "containers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"container_number" text NOT NULL,
	"eta_port" timestamp with time zone,
	"eta_warehouse" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "containers_container_number_unique" UNIQUE("container_number")
);
--> statement-breakpoint
CREATE TABLE "eta_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"container_id" uuid NOT NULL,
	"field" text NOT NULL,
	"previous_date" timestamp with time zone,
	"new_date" timestamp with time zone NOT NULL,
	"reason" text,
	"adjusted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"adjusted_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_notification_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"container_id" uuid NOT NULL,
	"customer_id" uuid,
	"email_override" text,
	"invoice_number" text NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notified_port_arrival" boolean DEFAULT false NOT NULL,
	"notified_warehouse_arrival" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eta_adjustments" ADD CONSTRAINT "eta_adjustments_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_notification_subscribers" ADD CONSTRAINT "shipment_notification_subscribers_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_notification_subscribers" ADD CONSTRAINT "shipment_notification_subscribers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_invoice_unique" ON "shipment_notification_subscribers" USING btree ("invoice_number","container_id");