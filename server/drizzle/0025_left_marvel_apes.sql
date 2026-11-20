ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "maintenanceExemptPaths" SET DEFAULT '{"/","/features","/changelog","/privacy","/terms"}';--> statement-breakpoint
ALTER TABLE "activity_log" ADD COLUMN "actorEmail" text;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
UPDATE "activity_log" SET "actorEmail" = (SELECT "email" FROM "user" WHERE "user"."id" = "activity_log"."userId");
