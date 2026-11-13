CREATE TABLE "email_send_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"send_id" uuid NOT NULL,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"requested_by" text,
	"retry_of_id" uuid,
	"status" text DEFAULT 'sending' NOT NULL,
	"recipient_count" integer NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "email_send_recipients" ADD CONSTRAINT "email_send_recipients_send_id_email_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."email_sends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_send_recipients_send_id_idx" ON "email_send_recipients" USING btree ("send_id");--> statement-breakpoint
CREATE INDEX "email_send_recipients_email_idx" ON "email_send_recipients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_sends_created_at_idx" ON "email_sends" USING btree ("created_at");