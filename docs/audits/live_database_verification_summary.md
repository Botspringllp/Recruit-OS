# RecruitOS - Live PostgreSQL Catalog Audit Summary

**Audit Date**: August 27, 2026  
**Target Environment**: Connected Supabase Cloud PostgreSQL 15.8 (Project Ref: `vlyfnzvlgftbkqtcbbck`)  
**Audit Method**: Direct PostgreSQL Catalog Execution (`information_schema.tables`, `pg_type`, `pg_tables`, `pg_policies`, `pg_indexes`, `storage.buckets`, `cron.job`)  

---

## 1. Live Catalog Query Results

| Metric / Catalog Object Type | Live Empirical Query Result | Verification Status |
|---|---|---|
| **1. Total Tables** | **43** | **LIVE (100% Deployed)** |
| **2. Total ENUM Types** | **28** | **LIVE (100% Deployed)** |
| **3. Total Functions / Routines** | **123** (System + Custom) | **LIVE (100% Deployed)** |
| **4. Total Indexes** | **72** (System Primary Keys + Custom Indexes) | **LIVE (100% Deployed)** |
| **5. Total Triggers** | **6** | **LIVE (100% Deployed)** |
| **6. Total RLS-Enabled Tables** | **43** | **LIVE (100% Deployed)** |
| **7. Total RLS Policies** | **10** (Public Schema Tenant Policies) | **LIVE (100% Deployed)** |
| **8. Total Storage Buckets** | **4** (`candidate-resumes`, etc.) | **LIVE (100% Deployed)** |
| **9. Total Cron Jobs** | **1** (`check-pipeline-sla-breaches-job`) | **LIVE (100% Deployed)** |

---

## 2. Critical Domain Tables Verification Matrix

| Table Name | Physical Existence | Live Status |
|---|---|---|
| `agencies` | **EXISTS** | **LIVE** |
| `users` | **EXISTS** | **LIVE** |
| `candidate_records` | **EXISTS** | **LIVE** |
| `job_mandates` | **EXISTS** | **LIVE** |
| `candidate_submissions` | **EXISTS** | **LIVE** |
| `interview_schedules` | **EXISTS** | **LIVE** |
| `notification_queues` | **EXISTS** | **LIVE** |
| `invoice_records` | **EXISTS** | **LIVE** |
