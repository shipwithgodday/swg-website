CREATE TABLE "booking_blackout_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_blackout_dates_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "booking_weekday_hours" (
	"weekday" integer PRIMARY KEY NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"open_time" text NOT NULL,
	"close_time" text NOT NULL,
	"slot_minutes" integer DEFAULT 60 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"whatsapp_number" text,
	"email" text NOT NULL,
	"organization" text,
	"desired_service" text NOT NULL,
	"meeting_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_date_time_unique" ON "bookings" USING btree ("date","time");