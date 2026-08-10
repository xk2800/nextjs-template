import { Card, CardContent } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"

export default function AdminStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton className="h-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
