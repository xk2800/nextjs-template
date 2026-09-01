CREATE TABLE "device_fingerprint" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"visitorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_fingerprint_user_visitor" UNIQUE("userId","visitorId")
);
--> statement-breakpoint
ALTER TABLE "device_fingerprint" ADD CONSTRAINT "device_fingerprint_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;