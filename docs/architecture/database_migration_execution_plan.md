# RecruitOS - Database Migration Execution Plan

**Database Engine**: PostgreSQL 15.8 (Supabase Cloud Ref: `vlyfnzvlgftbkqtcbbck`)  
**Target Schema File**: `database/schema.sql` (43 Tables, 28 ENUMs, 95 Indexes, RLS Policies)  

---

## 1. Migration Execution Step-by-Step Order

To execute `schema.sql` cleanly against the live Supabase database:

### Step 1: Execute Schema DDL Script
Open **Supabase Dashboard -> SQL Editor** (or connect via `DIRECT_URL` on port `5432`) and run the full contents of `database/schema.sql`.

### Step 2: Table Count & Inventory Verification Query
Execute the following verification query in the SQL Editor:
```sql
SELECT count(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```
*Expected Result*: **`total_tables = 43`**.

---

## 2. Table Inventory & RLS Verification Queries

### 2.1 Table Inventory Verification
```sql
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2.2 RLS Status Verification
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
*Expected Result*: `rowsecurity = true` for all 43 tenant-isolated tables.

### 2.3 RLS Policy Inspection
```sql
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 3. Storage Bucket & RLS Verification Checklist

- [ ] `candidate-resumes` bucket created and marked private.
- [ ] `compliance-documents` bucket created and marked private.
- [ ] `interview-recordings` bucket created and marked private.
- [ ] `agency-branding-assets` bucket created and marked public.
- [ ] `custom_access_token_hook` PostgreSQL function created and bound in Auth Hooks.
- [ ] `pg_cron` extension enabled and SLA check job scheduled.
