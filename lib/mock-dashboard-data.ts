// Placeholder data for the dashboard overview. Replace with real queries.
export const overviewStats = [
  { label: "Total users", value: "1,284", trend: "+12.5%", up: true, icon: "users" },
  { label: "Active subscriptions", value: "342", trend: "+4.1%", up: true, icon: "credit-card" },
  { label: "API usage", value: "86.2k", trend: "-2.3%", up: false, icon: "activity" },
  { label: "System health", value: "Operational", trend: "99.98% uptime", up: true, icon: "heart-pulse" },
] as const

export const usageSeries = [
  { month: "Jan", requests: 4200 },
  { month: "Feb", requests: 5100 },
  { month: "Mar", requests: 4800 },
  { month: "Apr", requests: 6300 },
  { month: "May", requests: 7200 },
  { month: "Jun", requests: 8600 },
]

export const recentActivity = [
  { id: 1, text: "New user signed up", time: "2m ago" },
  { id: 2, text: "Subscription upgraded to Pro", time: "1h ago" },
  { id: 3, text: "API key generated", time: "3h ago" },
  { id: 4, text: "Teammate invited", time: "Yesterday" },
]
