# RecruitOS - Deployment Checklist for Supabase SQL Editor

**Target Supabase Project**: `vlyfnzvlgftbkqtcbbck`  
**Execution Environment**: Supabase Dashboard -> SQL Editor  

---

## Execution Sequence & Checklist

Open **Supabase Dashboard -> SQL Editor** and execute the deployment scripts in the exact sequence below:

- [ ] **Phase 1**: Execute `database/deployment/01_extensions.sql` (Creates extensions `uuid-ossp`, `pgcrypto`, `pg_trgm`, `btree_gin`).
- [ ] **Phase 2**: Execute `database/deployment/02_enums.sql` (Creates 16 custom ENUM data types).
- [ ] **Phase 3**: Execute `database/deployment/03_functions.sql` (Creates `current_agency_id()`, `update_updated_at_column()`, and `custom_access_token_hook()`).
- [ ] **Phase 4**: Execute `database/deployment/04_tables.sql` (Creates 43 domain tables in topological sequence).
- [ ] **Phase 5**: Execute `database/deployment/05_indexes.sql` (Creates B-Tree and GIN trigram indexes).
- [ ] **Phase 6**: Execute `database/deployment/06_triggers.sql` (Attaches `updated_at` triggers).
- [ ] **Phase 7**: Execute `database/deployment/07_rls.sql` (Enables RLS on all 43 tables and creates tenant isolation policies).
- [ ] **Phase 8**: Execute `database/deployment/08_storage_setup.sql` (Provisions 4 storage buckets and RLS policies).
- [ ] **Phase 9**: Execute `database/deployment/09_cron_jobs.sql` (Configures `pg_cron` SLA evaluation job).

---

## Verification SQL Snippet (Run After Execution)

Run this SQL query to verify successful deployment:
```sql
SELECT count(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected Result: 43
```
