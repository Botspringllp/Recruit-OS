# RecruitOS - RC-01 Recruiter Cockpit Technical Design Specification

This document provides the technical design specification for **RC-01: Recruiter Cockpit**, the central operational dashboard for recruiters and agency founders in RecruitOS. It translates the PRD requirements, Stitch Design System UI/UX specifications, multi-tenant database schema, and RBAC matrix into an implementation blueprint using Next.js 14 App Router, TypeScript, TailwindCSS/Vanilla CSS tokens, Supabase, and Prisma.

---

## 1. Feature Breakdown & PRD Mapping

| Feature Sub-Module | Functional Requirement | UI/UX Component (Stitch Screen Mapping) | Primary User Persona |
|---|---|---|---|
| **RC-01.1 KPI Metric Strip** | Real-time counts of Active Mandates, Total Pipeline Candidates, SLA Alerts, Interviews Today, Monthly Fee Forecast | `StatCardGroup` (Screen 1 & 2) | `AGENCY_FOUNDER`, `RECRUITER` |
| **RC-01.2 Active Mandates Grid** | Card grid of open client mandates showing stage breakdown, assigned recruiter avatar, and fee % | `MandateGrid` / `MandateCard` (Screen 2) | `AGENCY_FOUNDER`, `RECRUITER` |
| **RC-01.3 SLA Watchdog Widget** | Real-time countdown feed of candidates in `WARNING` or `BREACHED` SLA status | `SlaWatchdogPanel` (Screen 1) | `AGENCY_FOUNDER`, `RECRUITER` |
| **RC-01.4 Today's Agenda & Schedules** | Chronological timeline of candidate interview preps, client feedback syncs, and follow-ups | `AgendaTimeline` (Screen 1) | `RECRUITER` |
| **RC-01.5 Recent Activity Feed** | Audit stream of recent candidate submissions, stage moves, and document uploads | `ActivityFeedStream` (Screen 1 & 29) | `AGENCY_FOUNDER`, `RECRUITER` |
| **RC-01.6 Quick Action Modals** | Shortcuts for Instant CV Drop, New Job Mandate, and Candidate Search Trigger | `QuickActionFloatingGroup` | `RECRUITER` |

---

## 2. Next.js 14 App Router Route Structure

```
src/app/(dashboard)/
├── layout.tsx                      # Dashboard Root Layout (Sidebar, TopNav, Tenant Context Provider)
├── cockpit/
│   ├── page.tsx                    # RC-01 Main Cockpit View (Server Component)
│   ├── loading.tsx                 # Skeleton UI Fallback for Cockpit
│   ├── error.tsx                   # Error Boundary Component
│   └── @modals/                    # Parallel Route for Quick Action Modals
│       ├── (.)quick-cv-intake/page.tsx
│       └── (.)create-mandate/page.tsx
```

---

## 3. Component Hierarchy (Server vs. Client Components)

```
CockpitPage (RSC - Server Component)
│
├── DashboardTopHeader (RSC)
│   ├── TenantBadge (RSC)
│   └── UserProfileDropdown (Client Component - Interactive)
│
├── KpiMetricBar (RSC - Parallel Data Fetch)
│   ├── StatCard [Active Mandates] (RSC)
│   ├── StatCard [Pipeline Candidates] (RSC)
│   ├── StatCard [SLA Warnings/Breaches] (RSC)
│   └── StatCard [Interviews Scheduled Today] (RSC)
│
├── CockpitMainLayout (RSC - 2-Column Responsive Grid)
│   │
│   ├── LeftColumn (2/3 width)
│   │   ├── ActiveMandatesSection (Client Component - Filterable & Searchable)
│   │   │   ├── MandateSearchFilterBar (Client Component)
│   │   │   └── MandateGrid (Client Component)
│   │   │       └── MandateCard (Client Component)
│   │   └── SLAWatchdogWidget (Client Component - Real-time polling/Supabase Realtime)
│   │       └── SlaAlertItem (Client Component)
│   │
│   └── RightColumn (1/3 width)
│       ├── TodayAgendaWidget (RSC + Client Component for Checkbox Toggle)
│       └── RecentActivityFeed (Client Component - Infinite Scroll Stream)
│
└── QuickActionFloatingToolbar (Client Component - Floating Action Button)
    ├── QuickCvIntakeModal (Client Component)
    └── QuickMandateModal (Client Component)
```

---

## 4. State Management & Data Fetching Plan

1. **Server-Side Data Fetching (RSC)**:
   - Initial page loads fetch KPI metrics, mandate summaries, and agenda items directly on the server via **Prisma Client** (bypassing HTTP fetch overhead).
   - Multi-tenant tenant ID (`agencyId`) resolved from Next.js server session cookies.
2. **Client-Side Interactive State**:
   - **Nuqs (URL Search Params)**: Mandate search filter (`?search=devops`), status tab (`?status=OPEN`), and page selection stored in URL for shareability.
   - **TanStack Query (React Query)**: SLA Watchdog and Recent Activity feed polling every 30 seconds to update countdown timers without full page refreshes.
   - **Zustand**: Global UI modal state (e.g. `isQuickCvModalOpen: boolean`).

---

## 5. API Requirements & Route Handlers

| Route Handler Endpoint | HTTP Method | RBAC Roles Allowed | Description |
|---|---|---|---|
| `/api/v1/cockpit/metrics` | `GET` | `AGENCY_FOUNDER`, `RECRUITER` | Returns aggregated count metrics for KPI cards. |
| `/api/v1/cockpit/mandates` | `GET` | `AGENCY_FOUNDER`, `RECRUITER` | Returns active mandates list with candidate stage distribution counts. |
| `/api/v1/cockpit/sla-watchdog` | `GET` | `AGENCY_FOUNDER`, `RECRUITER` | Returns candidate submissions in `WARNING` or `BREACHED` SLA state. |
| `/api/v1/cockpit/agenda` | `GET` | `AGENCY_FOUNDER`, `RECRUITER` | Returns confirmed interview schedules for the logged-in user for today. |
| `/api/v1/cockpit/activity` | `GET` | `AGENCY_FOUNDER`, `RECRUITER` | Paginated feed of `system_activity_logs` for the tenant. |

---

## 6. Database Dependencies & Query Specifications

### 6.1 Required Prisma Models
- `JobMandate` (Filtered by `agencyId`, `status: "OPEN"`, `deletedAt: null`)
- `CandidateSubmission` (Aggregated by `stage` and `slaStatus`)
- `CandidateRecord` (Recent additions & active pipeline candidates)
- `InterviewSchedule` (Filtered by `agencyId`, `confirmedStartTime` matching today)
- `SystemActivityLog` (Filtered by `agencyId`, ordered by `createdAt DESC`, limit 20)

### 6.2 Example High-Performance Aggregate Query (Prisma)
```ts
// Server Component Data Fetching Example Specification
const [activeMandateCount, activeSubmissionCount, slaAlertCount, interviewsToday] = await Promise.all([
  prisma.jobMandate.count({
    where: { agencyId, status: 'OPEN', deletedAt: null }
  }),
  prisma.candidateSubmission.count({
    where: { agencyId, stage: { notIn: ['JOINED', 'REJECTED'] } }
  }),
  prisma.candidateSubmission.count({
    where: { agencyId, slaStatus: { in: ['WARNING', 'BREACHED'] } }
  }),
  prisma.interviewSchedule.count({
    where: {
      agencyId,
      confirmedStartTime: {
        gte: startOfToday(),
        lte: endOfToday()
      }
    }
  })
]);
```

---

## 7. Sub-Phase Implementation Plan

```
Phase RC-01.A: Foundation & Layout Scaffolding
├── Setup App Router Cockpit page & loading boundaries
├── Implement Stitch Header, Navigation Sidebar, & User Profile
└── Build responsive CSS Grid layout shell

Phase RC-01.B: Metric Cards & Active Mandates Grid
├── Implement KPI Stat Cards with Server Components
├── Build Mandate Card component matching Stitch design
└── Add search & filter state via URL parameters

Phase RC-01.C: SLA Watchdog & Today's Agenda
├── Implement SLA Watchdog widget with live status badges
├── Build Agenda timeline list with confirmation links
└── Configure auto-refresh via React Query

Phase RC-01.D: Quick Intake Modals & Integration
├── Create Quick CV Upload Modal (Dropzone)
├── Integrate Supabase Storage client-side upload
└── Validate full multi-tenant isolation & RBAC rules
```
