ALTER TABLE "device_fingerprint" ADD COLUMN "components" jsonb;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "consentRequired" boolean;