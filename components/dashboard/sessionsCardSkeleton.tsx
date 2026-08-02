import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export default function SessionsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>Loading...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
