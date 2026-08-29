# RecruitOS - Live Database Audit Report

**Audit Date**: August 27, 2026  
**Audited Database Endpoint**: `aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` (Supabase Project Ref: `vlyfnzvlgftbkqtcbbck`)  
**Audit Method**: Automated PostgreSQL System Catalog Query Execution (`information_schema.tables`, `pg_type`, `pg_tables`, `pg_policies`, `pg_indexes`, `pg_extension`, `information_schema.routines`, `storage.buckets`)  

---

## 1. Execution Verification of `database/schema.sql`

- **Execution Status**: **NOT CONFIGURED**  
- **Empirical Evidence**: Execution of system catalog query `information_schema.tables` returned `0` public tables. The SQL DDL script `database/schema.sql` has **not** been executed against this live database instance yet.

---

## 2. Empirical Verification Query Results

| Metric / Object Type | Target Count (Spec) | Actual Live Result | Classification |
|---|---|---|---|
| **Total Public Tables** | 43 | **0** | **NOT CONFIGURED** |
| **Total Public ENUMs** | 28 | **12** (Default System ENUMs) | **PARTIALLY CONFIGURED** |
| **Total RLS-Enabled Tables** | 43 | **0** | **NOT CONFIGURED** |
| **Total RLS Policies** | 76 | **0** | **NOT CONFIGURED** |
| **Total Indexes** | 95 | **0** | **NOT CONFIGURED** |

---

## 3. Critical Tables Verification Matrix

| Table Name | Physical Existence | Column Count | Classification |
|---|---|---|---|
| `agencies` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `users` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `candidate_records` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `job_mandates` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `candidate_submissions` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `interview_schedules` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `notification_queues` | Does Not Exist | 0 | **NOT CONFIGURED** |
| `invoice_records` | Does Not Exist | 0 | **NOT CONFIGURED** |

---

## 4. PostgreSQL Extensions Verification

| Extension Name | Active in Database? | Classification |
|---|---|---|
| `pgcrypto` | **YES** | **LIVE** |
| `pg_trgm` | **NO** | **NOT CONFIGURED** |
| `btree_gin` | **NO** | **NOT CONFIGURED** |
| `pg_cron` | **NO** | **NOT CONFIGURED** |

---

## 5. Database Triggers & Helper Functions Verification

| Routine / Trigger Name | Schema | Physical Existence | Classification |
|---|---|---|---|
| `update_updated_at_column()` | `public` | Does Not Exist | **NOT CONFIGURED** |
| `current_agency_id()` | `public` | Does Not Exist | **NOT CONFIGURED** |
| `custom_access_token_hook()` | `public` | Does Not Exist | **NOT CONFIGURED** |

---

## 6. Storage Buckets Verification

| Bucket Name | Target Access Mode | Physical Existence | Classification |
|---|---|---|---|
| `candidate-resumes` | Private | Does Not Exist | **NOT CONFIGURED** |
| `compliance-documents` | Private | Does Not Exist | **NOT CONFIGURED** |
| `interview-recordings` | Private | Does Not Exist | **NOT CONFIGURED** |
| `agency-branding-assets` | Public | Does Not Exist | **NOT CONFIGURED** |

---

## 7. Master Classification Summary

```text
[LIVE]
- Database Connection Engine (PostgreSQL 15.8 on aws-0-ap-northeast-1.pooler.supabase.com:6543)
- Extension: pgcrypto

[PARTIALLY CONFIGURED]
- ENUM System (12 default Supabase auth ENUMs active; 28 custom domain ENUMs unapplied)

[NOT CONFIGURED]
- Execution of database/schema.sql DDL script
- All 43 Domain Tables (agencies, users, candidate_records, job_mandates, etc.)
- All 76 Row Level Security (RLS) Policies
- All 95 Index Optimizations
- Extensions: pg_trgm, btree_gin, pg_cron
- Functions: update_updated_at_column(), current_agency_id(), custom_access_token_hook()
- Storage Buckets: candidate-resumes, compliance-documents, interview-recordings, agency-branding-assets
```
