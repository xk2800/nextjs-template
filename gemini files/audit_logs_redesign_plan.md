# Audit Logs Page Redesign & Enhancement Plan

## 1. Executive Summary

The `/dashboard/admin/activity-logs` route provides administrators with an audit trail of system events, security interventions, and user activities.

Currently, the page stacks security highlight cards (**Impersonation log** and **Device throttle**) above a dedicated **Filters** card and the **Events** data table. While functional, this layout pushes the primary activity feed far below the fold and scatters filter controls across separate containers.

This plan details how to consolidate filter controls, optimize screen layout, add severity categorization, and improve date/event filtering capabilities.

## 2. Audit & Enhancement Breakdown

| Feature / Area | Current State | Proposed Enhancement |
| ----- | ----- | ----- |
| **Page Layout** | Impersonation and Device Throttle cards sit on top, creating long vertical scroll before reaching event logs. | Move security alerts into a compact, collapsible highlight bar or top summary KPIs so the Audit Log table takes center stage. |
| **Filter Bar UI** | Filters sit in a standalone card above the Events table with native text date inputs (`dd/mm/yyyy`). | Merge filter controls into a unified table toolbar featuring a visual **Date Range Picker** (with presets like "Last 7 Days", "Last 30 Days") and event severity filters. |
| **Event Categorization** | Events display generic text actions without visual categorization or risk levels. | Introduce **Severity Badges** (`Info`, `Warning`, `Critical`, `Security`) and categorical grouping (`Auth`, `User Admin`, `Billing`, `System`). |
| **Log Inspection** | Limited space to view full event details, raw JSON payloads, or user-agent details. | Add a click-to-open **Event Details Drawer / Modal** to inspect full request metadata, IP geolocation, and raw JSON payloads. |
| **Real-time Capabilities** | Static pagination with CSV export. | Retain CSV Export while adding a **Live Stream / Auto-Refresh** toggle (e.g., polling every 10 seconds) for real-time monitoring. |

## 3. Recommended Structural Layout

```
+-----------------------------------------------------------------------------------------+
| Audit Logs                                                                [ Live Feed ] |
| Review activity across all users and system events                        [ Export CSV] |
+-----------------------------------------------------------------------------------------+
| (Collapsible) Security Highlights: 2 Impersonations Active | All throttles nominal      |
+-----------------------------------------------------------------------------------------+
| Activity Events (173 total)                                                             |
| [ Search user/ip... ] [Category: All ▾] [Severity: All ▾] [📅 Last 7 Days ▾] [Clear]     |
+-----------------------------------------------------------------------------------------+
| Severity | Timestamp         | Actor (User)      | Event / Action     | Target   | Details |
|----------+-------------------+-------------------+--------------------+----------+---------|
| [Security| Aug 10, 12:51 AM  | Xavier Khew (Admin| Impersonation Start| xavier.. | [View ▾]|
| [ Warning| Aug 10, 12:30 AM  | System Throttle   | Failed Login (5x)  | IP 172.. | [View ▾]|
| [ Info   | Aug 09, 11:15 PM  | Test User         | Password Change    | Self     | [View ▾]|
+-----------------------------------------------------------------------------------------+
| Showing 1 - 20 of 173 events                                     [< Previous] [Next >]  |
+-----------------------------------------------------------------------------------------+
```

## 4. Sub-Component Breakdown

### 1. Unified Filter Toolbar

* **File:** `@/components/admin/logs/audit-log-toolbar.tsx`
* **Features:**
  * Search input (searches user email, IP address, or event action keyword).
  * Category dropdown (`Authentication`, `User Management`, `Billing`, `System`).
  * Severity filter (`Info`, `Warning`, `Critical`, `Security`).
  * Presets-enabled Date Range Picker (`Today`, `Last 7 Days`, `Last 30 Days`, `Custom Range`).
  * Reset filters button (`Clear`).

### 2. Event Severity & Category Badges

* **File:** `@/components/admin/logs/audit-severity-badge.tsx`
* **Badges:**
  * 🔵 `Info` — Standard operational events (e.g., logins, profile updates).
  * 🟡 `Warning` — Non-blocking anomalies (e.g., failed login attempts, password reset requests).
  * 🔴 `Critical` — Destructive operations (e.g., user deletion, workspace deletion).
  * 🛡️ `Security` — Admin privilege events (e.g., impersonation start/stop, role escalation, IP block).

### 3. Detailed Inspection Drawer

* **File:** `@/components/admin/logs/event-details-drawer.tsx`
* **Features:**
  * Displays user agent string, full IP address, location metadata, request headers, and formatted JSON payload of `metadata` / `changes`.

### 4. Real-time Live Log Switch

* **File:** `@/components/admin/logs/live-feed-toggle.tsx`
* **Features:** Allows admins monitoring active deployments or incidents to stream incoming events automatically without refreshing the page.

## 5. Code Architecture Blueprint (`app/dashboard/admin/activity-logs/page.tsx`)

```tsx
import { AuditLogToolbar } from "@/components/admin/logs/audit-log-toolbar";
import { AuditLogTable } from "@/components/admin/logs/audit-log-table";
import { SecurityHighlightsBanner } from "@/components/admin/logs/security-highlights-banner";
import { ExportLogsButton } from "@/components/admin/logs/export-logs-button";
import { LiveFeedToggle } from "@/components/admin/logs/live-feed-toggle";

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header with Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Review activity streams, security alerts, and system events across all users.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveFeedToggle />
          <ExportLogsButton />
        </div>
      </div>

      {/* Security Alerts Summary Banner (Collapsible) */}
      <SecurityHighlightsBanner />

      {/* Main Audit Feed Container */}
      <div className="space-y-4">
        <AuditLogToolbar />
        <AuditLogTable />
      </div>
    </div>
  );
}
```

## 6. Implementation Checklist

* [ ] Consolidate standalone filter inputs into `<AuditLogToolbar />`.
* [ ] Replace native date input fields with a Shadcn UI Date Range Picker component.
* [ ] Build `<AuditSeverityBadge />` component for visual risk indicators.
* [ ] Implement `<EventDetailsDrawer />` to view raw event JSON metadata.
* [ ] Add a Live Feed toggle switch for auto-refreshing logs.
* [ ] Ensure CSV export includes current active filter parameters (date range, user filter).