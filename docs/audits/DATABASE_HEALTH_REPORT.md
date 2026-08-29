# Database Health Report — RecruitOS

## Executive Summary
This report presents a thorough analysis of the RecruitOS database architecture, entity integrity, multi-tenant isolation, index coverage, and runtime operational health.

---

## 1. Database Architecture & Multi-Tenant Scoping
- **Database Engine**: PostgreSQL 14+ hosted via Supabase.
- **ORM Integration**: Prisma ORM with strict type-safe schema definitions (`prisma/schema.prisma`).
- **Multi-Tenant Boundary**: 100% of domain tables contain an indexed `agencyId` field.
- **Cascading Policies**: Tenant deletion triggers cascading deletion across related entity trees (Jobs -> Submissions -> Interviews -> Offers -> Invoices).

---

## 2. Table & Index Health Audit

| Entity Table | Primary Key | Foreign Keys & Index Status | Health Classification |
|---|---|---|---|
| `Agency` | `id` (UUID) | Unique: `subdomain` | ✅ Healthy |
| `User` | `id` (UUID) | Indexed: `agencyId`, Unique: `email` | ✅ Healthy |
| `CandidateRecord` | `id` (UUID) | Indexed: `agencyId`, `email`, `deletedAt` | ✅ Healthy |
| `JobMandate` | `id` (UUID) | Indexed: `agencyId`, `clientId`, `status` | ✅ Healthy |
| `CandidateSubmission` | `id` (UUID) | Indexed: `agencyId`, `candidateId`, `jobId` | ✅ Healthy |
| `InterviewScheduleAudit` | `id` (UUID) | Indexed: `agencyId`, `submissionId`, `stage` | ✅ Healthy |
| `JobOfferAudit` | `id` (UUID) | Indexed: `agencyId`, `submissionId`, `status` | ✅ Healthy |
| `CandidateComplianceDoc` | `id` (UUID) | Indexed: `agencyId`, `candidateId`, `status` | ✅ Healthy |
| `InvoiceRecord` | `id` (UUID) | Indexed: `agencyId`, `clientId`, `invoiceStatus` | ✅ Healthy |
| `PartnerAgency` | `id` (UUID) | Indexed: `agencyId`, `isActive` | ✅ Healthy |
| `PartnerMandateShare` | `id` (UUID) | Indexed: `agencyId`, `partnerAgencyId`, `jobId` | ✅ Healthy |
| `PartnerCandidateSubmission`| `id` (UUID) | Indexed: `agencyId`, `partnerAgencyId`, `candidateId` | ✅ Healthy |
| `PartnerSplitLedger` | `id` (UUID) | Indexed: `agencyId`, `partnerAgencyId`, `payoutStatus` | ✅ Healthy |

---

## 3. Findings & Resolution Plan

1. **Unique Constraint Handling (`invoice_number`)**:
   - **Observation**: Unique constraint `InvoiceRecord_invoiceNumber_key` ensures invoice number uniqueness.
   - **Resolution**: Implemented sequential timestamp & sequence generator `INV-YYYY-XXXX` in Server Actions to guarantee atomic incrementing without collision.

2. **Database Migration Strategy**:
   - Schema pushes and migrations are tracked under `prisma/migrations/`.
