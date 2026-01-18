import { db } from "@/server/db"
import { activityLogs, users } from "@/server/db/schema"
import { eq, desc } from "drizzle-orm"

export async function getUserActivityLogs(userId: string, limit = 50) {
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
}

export async function getAllActivityLogs(limit = 100, offset = 0) {
  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      description: activityLogs.description,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      userId: activityLogs.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset)
}
