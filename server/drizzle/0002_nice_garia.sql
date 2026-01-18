CREATE TYPE "public"."activity_actions" AS ENUM('login', 'logout', 'login_failed', 'password_changed', 'email_changed', 'profile_updated', 'session_revoked', 'user_deleted', 'user_banned', 'user_unbanned', 'role_changed');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"action" "activity_actions" NOT NULL,
	"description" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bannedAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bannedReason" text;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;