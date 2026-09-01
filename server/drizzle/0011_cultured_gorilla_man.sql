CREATE TABLE "auth_throttle" (
	"fingerprint" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"windowStart" timestamp DEFAULT now() NOT NULL,
	"lastAttemptAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"lastEmail" text,
	"lastKind" text
);
