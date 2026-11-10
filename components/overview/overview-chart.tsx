"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { usageSeries } from "@/lib/mock-dashboard-data"

const config = { requests: { label: "Requests", color: "var(--chart-1)" } } satisfies ChartConfig

export function OverviewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API usage</CardTitle>
        <CardDescription>Requests per month (sample data)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <AreaChart data={usageSeries}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="requests" type="monotone" fill="var(--color-requests)" fillOpacity={0.2} stroke="var(--color-requests)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
