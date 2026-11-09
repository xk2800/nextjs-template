ALTER TABLE "consent_log" ADD COLUMN "previousId" text;--> statement-breakpoint
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_chain" UNIQUE("userId","previousId");