ALTER TYPE "public"."activity_actions" ADD VALUE 'settings_changed';--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"maintenanceMode" boolean DEFAULT false NOT NULL,
	"maintenanceMessage" text,
	"authEnableGoogle" boolean DEFAULT true NOT NULL,
	"authEnableEmailPassword" boolean DEFAULT true NOT NULL,
	"authEnableOneTap" boolean DEFAULT false NOT NULL,
	"enableSessionRevocation" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" text,
	CONSTRAINT "system_settings_singleton" CHECK ("system_settings"."id" = 'default')
);
--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedBy_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;