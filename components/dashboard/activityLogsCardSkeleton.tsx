import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export default function ActivityLogsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>Loading...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
