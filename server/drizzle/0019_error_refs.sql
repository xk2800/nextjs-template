CREATE TABLE "error_refs" (
	"ref" text PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"detail" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "error_refs_created_at_idx" ON "error_refs" USING btree ("createdAt");