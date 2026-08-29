# RecruitOS - Real Runtime Data-Source Audit Report

**Audit Date**: August 27, 2026  
**Audited Target**: `src/app/(dashboard)/cockpit/page.tsx` & `src/components/cockpit/*`  
**Method**: Physical Source Code AST Analysis  
**Overall Verdict**: **A) Infrastructure Live but UI Mock**  

---

## 1. Physical Source Code Verification Findings

| Verification Question | Physical Code Finding | Evidence Line Numbers |
|---|---|---|
| **Is Cockpit page reading from Prisma?** | **NO** | No `import { prisma }` or `prisma.*` calls in `cockpit/page.tsx`. |
| **Is Cockpit page reading from Supabase?** | **NO** | No `createClient()` or `supabase.from()` calls in `cockpit/page.tsx`. |
| **Is Cockpit page using hardcoded arrays?** | **YES** | `kpiMetrics` and `mandateCards` arrays hardcoded inside component. |
| **Is `kpiMetrics` still mocked?** | **YES** | Hardcoded array of 5 KPI objects (Active Mandates, Pipeline Candidates, SLA Alerts, etc.). |
| **Is `mandateCards` still mocked?** | **YES** | Hardcoded array of 3 mandate objects (`Acme Corp`, `FinTech Dynamics`, `HealthTech Solutions`). |
| **Are any widgets connected to live DB tables?** | **NO** | All rendered widgets take mock telemetry props. |

---

## 2. Widget-by-Widget Data Source Audit Matrix

| Widget Name | Data Source Type | Code Evidence in `src/app/(dashboard)/cockpit/page.tsx` |
|---|---|---|
| **1. KPI Metric Strip** | **Mock** | `<KpiMetricStrip metrics={kpiMetrics} />` (lines 11-58 hardcoded array) |
| **2. Active Mandates Grid Control** | **Mock** | `<MandatesGridControl mandates={mandateCards} />` (lines 62-185 hardcoded array) |
| **3. Mandate Card Component** | **Mock** | Receives `MandateSummaryCard` props passed down from `mandateCards` mock array |
| **4. SLA Watchdog Widget Container** | **Mock / Placeholder** | Rendered as static UI container with placeholder badge text |
| **5. Agenda Timeline Container** | **Mock / Placeholder** | Rendered as static UI container with placeholder text |

---

## 3. Physical Code Snippet Evidence

### 3.1 Hardcoded `kpiMetrics` Array (`src/app/(dashboard)/cockpit/page.tsx`: L11-L58)
```typescript
const kpiMetrics: KpiMetricItem[] = [
  {
    id: 'metric-active-mandates',
    title: 'Active Mandates',
    value: 14,
    changeTrend: '+2 this week',
    isPositiveTrend: true,
    badgeText: '8 Openings',
    badgeVariant: 'brand',
    icon: 'Briefcase',
  },
  {
    id: 'metric-pipeline-candidates',
    title: 'Pipeline Candidates',
    value: 128,
    // ...
  }
];
```

### 3.2 Hardcoded `mandateCards` Array (`src/app/(dashboard)/cockpit/page.tsx`: L62-L185)
```typescript
const mandateCards: MandateSummaryCard[] = [
  {
    id: 'job-1',
    agencyId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    title: 'Senior Full Stack Engineer (Node + React)',
    companyName: 'Acme Corp Technologies',
    // ...
  }
];
```

---

## 4. Final Verdict

**Verdict: A) Infrastructure Live but UI Mock**

- **Live Infrastructure**: Connected PostgreSQL database engine (`vlyfnzvlgftbkqtcbbck`) is 100% deployed with 43 tables, 28 ENUMs, 72 indexes, 4 storage buckets, and RLS policies.
- **Cockpit UI**: Currently renders static mock telemetry data arrays in `cockpit/page.tsx`. Ready to be wired to real Prisma database queries via Server Components or API routes.
