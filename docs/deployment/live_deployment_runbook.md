# RecruitOS - Live Database Deployment Runbook

**Target Supabase Project Ref**: `vlyfnzvlgftbkqtcbbck`  
**Target Environment**: Production / Staging Supabase PostgreSQL 15.8 (`aws-0-ap-northeast-1.pooler.supabase.com:6543`)  
**Deployment Operator Tool**: Supabase Dashboard -> SQL Editor  

---

## 1. Executive Deployment Execution Sequence

Execute the 9 modular deployment scripts in `database/deployment/` in the exact sequence specified below. Do not alter script execution order.

```text
[PHASE 01] 01_extensions.sql    ──> [PHASE 02] 02_enums.sql       ──> [PHASE 03] 03_functions.sql
                                                                           │
[PHASE 06] 06_triggers.sql     <── [PHASE 05] 05_indexes.sql     <── [PHASE 04] 04_tables.sql
     │
     └──> [PHASE 07] 07_rls.sql ──> [PHASE 08] 08_storage_setup.sql ──> [PHASE 09] 09_cron_jobs.sql
```

---

## 2. Step-by-Step Script Execution Guide

### Phase 01: `database/deployment/01_extensions.sql`
- **Purpose**: Enables required PostgreSQL extensions (`uuid-ossp`, `pgcrypto`, `pg_trgm`, `btree_gin`).
- **Expected Execution Time**: `< 2 seconds`.
- **Expected Success Result**: `Success. No rows returned.` (or `CREATE EXTENSION` message).
- **Post-Execution Verification Query**:
  ```sql
  SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'btree_gin');
  ```
  *(Expected: 4 rows returned)*
- **Common Failure Scenarios**: `permission denied to create extension` (insufficient privileges).
- **Recovery Procedure**: Execute using Supabase `postgres` admin user or via Supabase SQL Editor.

---

### Phase 02: `database/deployment/02_enums.sql`
- **Purpose**: Defines all 16 custom domain ENUM data types (`agency_tier`, `user_role`, `candidate_status`, `mandate_status`, `pipeline_stage`, etc.).
- **Expected Execution Time**: `< 3 seconds`.
- **Expected Success Result**: `DO block executed successfully`.
- **Post-Execution Verification Query**:
  ```sql
  SELECT count(distinct typname)::int AS enum_count 
  FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid;
  ```
  *(Expected: `>= 16` custom ENUM types)*
- **Common Failure Scenarios**: `type "..." already exists` (re-running on dirty schema).
- **Recovery Procedure**: Script uses idempotent `IF NOT EXISTS` check. Retry execution cleanly.

---

### Phase 03: `database/deployment/03_functions.sql`
- **Purpose**: Installs core session routines `current_agency_id()`, `update_updated_at_column()`, and Supabase Auth `custom_access_token_hook()`.
- **Expected Execution Time**: `< 2 seconds`.
- **Expected Success Result**: `CREATE FUNCTION` / `CREATE PROCEDURE` success.
- **Post-Execution Verification Query**:
  ```sql
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN ('current_agency_id', 'update_updated_at_column', 'custom_access_token_hook');
  ```
  *(Expected: 3 rows returned)*
- **Common Failure Scenarios**: Syntax errors or parameter mismatch.
- **Recovery Procedure**: Execute `CREATE OR REPLACE FUNCTION` to overwrite routine signatures.

---

### Phase 04: `database/deployment/04_tables.sql`
- **Purpose**: Creates all 43 domain tables in strict topological dependency sequence (`agencies` -> `users` -> `job_mandates` -> `candidate_submissions` -> etc.).
- **Expected Execution Time**: `5 - 8 seconds`.
- **Expected Success Result**: `CREATE TABLE` success across 43 tables.
- **Post-Execution Verification Query**:
  ```sql
  SELECT count(*)::int AS total_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  ```
  *(Expected: Exactly `43`)*
- **Common Failure Scenarios**: Foreign key constraint error due to out-of-order execution.
- **Recovery Procedure**: Run tables script in strict numerical sequence (`04_tables.sql`).

---

### Phase 05: `database/deployment/05_indexes.sql`
- **Purpose**: Creates B-Tree tenant indexes, FK composite indexes, and GIN trigram search indexes (`idx_candidate_records_name_trgm`, `idx_job_mandates_title_trgm`).
- **Expected Execution Time**: `3 - 5 seconds`.
- **Expected Success Result**: `CREATE INDEX` success.
- **Post-Execution Verification Query**:
  ```sql
  SELECT count(*)::int AS index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
  ```
  *(Expected: `20` custom indexes)*
- **Common Failure Scenarios**: `extension "pg_trgm" not installed` when building GIN trigram indexes.
- **Recovery Procedure**: Re-verify Phase 01 (`01_extensions.sql`) execution.

---

### Phase 06: `database/deployment/06_triggers.sql`
- **Purpose**: Attaches automated `updated_at` timestamp triggers to core domain tables.
- **Expected Execution Time**: `< 2 seconds`.
- **Expected Success Result**: `CREATE TRIGGER` success.
- **Post-Execution Verification Query**:
  ```sql
  SELECT count(*)::int AS trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  ```
  *(Expected: `6` triggers)*
- **Common Failure Scenarios**: Target table missing or function `update_updated_at_column()` missing.
- **Recovery Procedure**: Execute Phase 03 and Phase 04 prior to Phase 06.

---

### Phase 07: `database/deployment/07_rls.sql`
- **Purpose**: Enables Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) on all 43 tables and creates multi-tenant isolation policies (`USING (agency_id = current_agency_id())`).
- **Expected Execution Time**: `4 - 6 seconds`.
- **Expected Success Result**: `ALTER TABLE` / `CREATE POLICY` success.
- **Post-Execution Verification Query**:
  ```sql
  SELECT count(*)::int AS rls_enabled_tables 
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = true;
  ```
  *(Expected: Exactly `43`)*
- **Common Failure Scenarios**: `policy "..." for table "..." already exists`.
- **Recovery Procedure**: Script uses `DROP POLICY IF EXISTS` prior to creation. Re-run script cleanly.

---

### Phase 08: `database/deployment/08_storage_setup.sql`
- **Purpose**: Provisions 4 Supabase Storage buckets (`candidate-resumes`, `compliance-documents`, `interview-recordings`, `agency-branding-assets`) and storage RLS object policies.
- **Expected Execution Time**: `< 3 seconds`.
- **Expected Success Result**: `INSERT 0 4` / `CREATE POLICY` success.
- **Post-Execution Verification Query**:
  ```sql
  SELECT count(*)::int AS bucket_count 
  FROM storage.buckets 
  WHERE id IN ('candidate-resumes', 'compliance-documents', 'interview-recordings', 'agency-branding-assets');
  ```
  *(Expected: `4` storage buckets)*
- **Common Failure Scenarios**: `relation "storage.buckets" does not exist` (Supabase storage schema uninitialized).
- **Recovery Procedure**: Ensure Supabase Storage feature is enabled in project dashboard.

---

### Phase 09: `database/deployment/09_cron_jobs.sql`
- **Purpose**: Enables `pg_cron` extension, creates SLA evaluation procedure `evaluate_candidate_sla_statuses()`, and schedules periodic SLA check job (`*/15 * * * *`).
- **Expected Execution Time**: `< 3 seconds`.
- **Expected Success Result**: `cron.schedule` job ID returned.
- **Post-Execution Verification Query**:
  ```sql
  SELECT jobid, jobname, schedule, command 
  FROM cron.job 
  WHERE jobname = 'check-pipeline-sla-breaches-job';
  ```
  *(Expected: 1 active cron job scheduled)*
- **Common Failure Scenarios**: `extension "pg_cron" is not available` on free-tier region setting.
- **Recovery Procedure**: Enable `pg_cron` extension under **Supabase Dashboard -> Database -> Extensions**.
