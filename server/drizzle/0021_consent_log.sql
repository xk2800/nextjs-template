CREATE TABLE "consent_log" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"choice" text NOT NULL,
	"version" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_log_user_idx" ON "consent_log" USING btree ("userId","createdAt");