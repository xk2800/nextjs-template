ALTER TYPE "public"."activity_actions" ADD VALUE 'impersonation_started';--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonatedBy" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banExpires" timestamp;