CREATE INDEX "activity_log_user_created_idx" ON "activity_log" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "activity_log_created_idx" ON "activity_log" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("userId");