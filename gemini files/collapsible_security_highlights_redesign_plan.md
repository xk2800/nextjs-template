# Collapsible Security Highlights Component Plan

## 1. Executive Summary

Introducing a collapsible accordion wrapper (`▼ Security highlights: impersonation log and device throttling`) on the `/dashboard/admin/activity-logs` page is a positive layout improvement. It allows administrators to collapse high-level security banners and bring the primary **Audit Logs** table directly above the fold.

This plan focuses on refining the visual hierarchy of this component—specifically by eliminating nested card borders, making the collapsed header informative at a glance with dynamic status badges, and styling the trigger to match modern UI component standards.

## 2. Audit & Refinement Breakdown

| Design Aspect | Current Implementation | Proposed Refinement |
| ----- | ----- | ----- |
| **Collapsed Header Info** | Plain text string (`Security highlights impersonation log and device throttling`). | Add dynamic summary badges to the trigger header so admins get instant status updates *without* needing to expand the card (e.g., `2 Active Impersonations` \| `✓ 0 Throttles`). |
| **Card Nesting & Borders** | Triple-nested borders (Outer container $\rightarrow$ Accordion body $\rightarrow$ Inner cards for Impersonation and Throttle). | Replace inner card wrappers with a clean single-card split grid or borderless horizontal rows. |
| **Accordion Trigger Styling** | Resembles default browser collapsible text with standard arrow characters (`▼`). | Use a styled Shadcn UI `<CollapsibleTrigger>` component with smooth chevron rotation, hover backgrounds, and badge indicators. |
| **Content Duplication** | Re-renders full impersonation logs that already exist under `Users > Impersonation Logs`. | Keep this section focused on **real-time security alerts** (active throttling, abuse flags, active admin impersonation alerts). |

## 3. Structural Wireframes

### State A: Collapsed (Default View)
Provides instant security status without taking up vertical viewport space:

```
+-----------------------------------------------------------------------------------------+
| Audit Logs                                                                [ Live Feed ] |
| Review activity across all users and system events                        [ Export CSV] |
+-----------------------------------------------------------------------------------------+
| [▶] Security Highlights  [ 🛡️ 2 Active Impersonations ]  [ ✓ 0 Abuse Throttles ]        |
+-----------------------------------------------------------------------------------------+
| (Audit Log Data Table sits immediately below, above the fold)                           |
+-----------------------------------------------------------------------------------------+
```

### State B: Expanded (Detailed View)
Reveals structured, borderless status grids when toggled open:

```
+-----------------------------------------------------------------------------------------+
| [▼] Security Highlights                                                                 |
| +------------------------------------+------------------------------------------------+ |
| | 🎭 Recent Impersonation Activity   | 🛡️ Security Throttling & Abuse Status         | |
| |                                    |                                                | |
| | • Xavier Khew → test (10m ago)     |  ✓ All security limits nominal.                | |
| | • Xavier Khew → test (30m ago)     |  ✓ 0 IP fingerprints blocked.                  | |
| |                                    |                                                | |
| | [ View All Impersonation Logs → ]  |  [ View Throttling Rules → ]                  | |
| +------------------------------------+------------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```

## 4. Sub-Component Architecture

### 1. Collapsible Security Highlights Container

* **File:** `@/components/admin/logs/security-highlights-collapsible.tsx`
* **Features:** 
  * Uses `@radix-ui/react-collapsible` or Shadcn UI `Collapsible`.
  * Persists collapsed/expanded state to `localStorage` so the admin's preference is saved across sessions.

### 2. Summary Trigger Badges

* **File:** `@/components/admin/logs/security-summary-badges.tsx`
* **Features:** Renders colorful risk pills directly inside the accordion header:
  * 🟡 `N Active Impersonations`
  * 🔴 `N IP Throttles Active` (if abuse detected)
  * 🟢 `All Security Limits Nominal` (if clean)

## 5. Component Code Blueprint

Below is the code template for updating `@/components/admin/logs/security-highlights-collapsible.tsx`:

```tsx
"use client";

import * as React from "react";
import { ChevronRight, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SecurityHighlightsProps {
  activeImpersonationsCount?: number;
  throttleAbuseCount?: number;
}

export function SecurityHighlightsCollapsible({
  activeImpersonationsCount = 2,
  throttleAbuseCount = 0,
}: SecurityHighlightsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      {/* Accordion Header / Trigger */}
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between p-4 hover:bg-muted/50 h-auto"
        >
          <div className="flex items-center gap-3">
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
            <span className="font-semibold text-sm">Security Highlights</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Impersonation & Abuse Monitoring
            </span>
          </div>

          {/* Collapsed Summary Badges */}
          <div className="flex items-center gap-2">
            {activeImpersonationsCount > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-500 bg-amber-500/10">
                <UserCheck className="h-3 w-3" />
                {activeImpersonationsCount} Impersonation{activeImpersonationsCount > 1 ? "s" : ""}
              </Badge>
            )}

            {throttleAbuseCount === 0 ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                <ShieldCheck className="h-3 w-3" />
                Limits Nominal
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3 w-3" />
                {throttleAbuseCount} Throttles Blocked
              </Badge>
            )}
          </div>
        </Button>
      </CollapsibleTrigger>

      {/* Accordion Expanded Content */}
      <CollapsibleContent className="border-t p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Impersonation Section */}
          <div className="space-y-2 rounded-md bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Impersonation Activity
              </h4>
              <Badge variant="secondary" className="text-[10px]">Security</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent admin impersonation sessions across accounts.
            </p>
            {/* Entry List */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span>Xavier Khew Dev &rarr; test</span>
                <span className="text-muted-foreground">Aug 10, 12:51 AM</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Xavier Khew Dev &rarr; test</span>
                <span className="text-muted-foreground">Aug 10, 12:31 AM</span>
              </div>
            </div>
          </div>

          {/* Device Throttle Section */}
          <div className="space-y-2 rounded-md bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Device Throttle
              </h4>
              <Badge variant="secondary" className="text-[10px]">Abuse Limits</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Fingerprints hitting sign-in/sign-up abuse limits.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-500 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>All security limits nominal. No abuse activity detected.</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

## 6. Implementation Checklist

* [ ] Refactor accordion trigger to use standard Shadcn `Collapsible` components.
* [ ] Add dynamic `<Badge />` indicators inside the trigger header (e.g., `Limits Nominal`, `N Impersonations`).
* [ ] Remove heavy nested inner card borders inside the expanded body in favor of subtle `bg-muted/40` panels.
* [ ] Add dynamic rotation to the chevron indicator icon (`rotate-90` when expanded).
* [ ] Optionally persist `isOpen` state in `localStorage` so administrator preferences remain intact across page reloads.