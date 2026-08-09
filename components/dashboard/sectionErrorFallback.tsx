import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

export default function SectionErrorFallback({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-4">
          <AlertTriangle className="size-4 text-destructive shrink-0" />
          Something went wrong loading this section. Try refreshing the page.
        </p>
      </CardContent>
    </Card>
  )
}
