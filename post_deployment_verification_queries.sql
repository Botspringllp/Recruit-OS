-- RecruitOS Post-Deployment Complete Verification Query Package
-- Target Database: Supabase Cloud PostgreSQL 15.8 (Project Ref: vlyfnzvlgftbkqtcbbck)

-- 1. Table Count Verification (Expected: 43)
SELECT count(*)::int AS total_public_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. List of All 43 Tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Custom Domain ENUM Count (Expected: >= 16)
SELECT count(distinct typname)::int AS total_enums 
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid;

-- 4. Custom Index Count Verification (Expected: 20)
SELECT count(*)::int AS total_custom_indexes 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- 5. Trigger Count Verification (Expected: 6)
SELECT count(*)::int AS total_triggers 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 6. Helper Function & Routine Verification (Expected: 3)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('current_agency_id', 'update_updated_at_column', 'custom_access_token_hook');

-- 7. RLS-Enabled Tables Verification (Expected: 43)
SELECT count(*)::int AS total_rls_enabled_tables 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 8. Storage Buckets Verification (Expected: 4)
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('candidate-resumes', 'compliance-documents', 'interview-recordings', 'agency-branding-assets');

-- 9. Scheduled Cron Job Verification (Expected: 1)
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'check-pipeline-sla-breaches-job';
