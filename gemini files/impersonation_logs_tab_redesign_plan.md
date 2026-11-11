# Impersonation Logs Tab Redesign Plan

## 1. Executive Summary

Separating **Impersonation Logs** into a dedicated sub-tab on the `/dashboard/admin/users` page was a great architectural improvement—it removes visual clutter from the main user directory.

However, the current tab content simply renders a small highlight card with two entries and a link to the main audit log. When an admin clicks the "Impersonation Logs" tab, they expect a dedicated, searchable, and actionable management table for all impersonation sessions rather than just a summary preview.

This plan outlines how to convert this tab into a full-featured Impersonation Security Hub.

## 2. Audit & Enhancement Opportunities

| Feature / Area | Current State | Target State |
| ----- | ----- | ----- |
| **Card Nesting** | The tab contains an inner card labeled "Impersonation log", creating redundant border/container nesting. | Remove outer card padding and display full-width metric cards and a dedicated Impersonation Data Table directly inside the tab container. |
| **Session Status** | Entries show a generic `Started` badge with no indication of whether the impersonation is currently active or ended. | Introduce clear session status badges: `🟢 Active Now`, `⚪ Ended`, `🔴 Revoked`. |
| **Impersonation Controls** | Admins cannot terminate an ongoing impersonation session from this screen. | Add an inline **"End Session"** or **"Force Logout Impersonation"** button for active sessions. |
| **Metadata & Context** | Displays basic string: `Xavier Khew Dev → test`. | Display structured columns: **Performing Admin**, **Target User**, **Session Duration**, **IP Address**, **Started At**, and **Actions**. |
| **Audit Depth** | Shows only 2 recent records and redirects users away to `/activity-logs`. | Render full paginated history with inline search and date filters directly within the tab. |

## 3. Structural Wireframe

```
+-----------------------------------------------------------------------------------------+
| User Management                                                                         |
| Manage users, view activity, and control access                                         |
+-----------------------------------------------------------------------------------------+
| [ All Users (11) ]  [ 🟢 Impersonation Logs (2 Active) ]                                |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [ Stat: Active Sessions (1) ]  [ Stat: Total Today (3) ]  [ Stat: Unique Admins (2) ]  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| Impersonation Audit Feed                                                                |
| [ Search admin or target... ] [Status: All ▾]                     [ 🔄 Refresh Feed ]  |
+-----------------------------------------------------------------------------------------+
| Status    | Admin User       | Target Account   | Started At    | Duration | Actions  |
|-----------+------------------+------------------+---------------+----------+----------|
| 🟢 Active | Xavier (Admin)   | test@example.com | 10 mins ago   | 00:10:42 | [ End ]  |
| ⚪ Ended  | Xavier (Admin)   | dev@example.com  | Yesterday     | 00:45:12 | [ View ] |
+-----------------------------------------------------------------------------------------+
| Showing 1 - 2 of 2 impersonation sessions                         [< Previous] [Next >] |
+-----------------------------------------------------------------------------------------+
```

## 4. Component Breakdown & DX Objectives

### 1. Impersonation Overview KPI Grid
* **File:** `@/components/admin/users/impersonation-stats.tsx`
* **Purpose:** Highlights real-time risk metrics:
  * **Currently Active Impersonations** (with a pulsing green status indicator).
  * **Impersonation Events (Last 24 Hours)**.
  * **Unique Admins Using Feature**.

### 2. Impersonation Data Table
* **File:** `@/components/admin/users/impersonation-table.tsx`
* **Purpose:** Displays all impersonation records with structured metadata:
  * **Status Badge:** Visual differentiation between active and historical sessions.
  * **Admin & Target:** Direct links to both the admin profile and target user detail pages.
  * **Timestamp & Duration:** Relative start time alongside calculated session length.
  * **IP & User Agent:** Hover tooltip showing IP address and browser context.

### 3. Active Session Remediation Actions
* **File:** `@/components/admin/users/impersonation-row-actions.tsx`
* **Purpose:** Provides a button for active sessions allowing super-admins to instantly kill an active impersonation token without restarting the application.

## 5. Code Architecture Blueprint (`app/dashboard/admin/users/_components/impersonation-tab.tsx`)

```tsx
import { ImpersonationStats } from "./impersonation-stats";
import { ImpersonationTable } from "./impersonation-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function ImpersonationTab() {
  return (
    <div className="space-y-6">
      {/* KPI Overview Grid */}
      <ImpersonationStats />

      {/* Control Bar & Data Table */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by admin or target email..."
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <ImpersonationTable />
      </div>
    </div>
  );
}
```

## 6. Implementation Checklist

- [ ] Remove nested outer `<Card>` wrapper from the tab view to prevent visual double-carding.
- [ ] Add top KPI summary grid showing active vs past impersonation counts.
- [ ] Build `<ImpersonationTable />` with status badges (`🟢 Active` vs `⚪ Ended`).
- [ ] Add session duration calculator (`Started At` to `Ended At`).
- [ ] Add an instant "End Active Impersonation" server action button.
- [ ] Implement search filtering by Admin Email or Target User Email.