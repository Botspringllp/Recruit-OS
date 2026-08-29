# RecruitOS - Supabase Infrastructure Setup Specification

This document provides the definitive infrastructure setup specification for deploying the RecruitOS platform on **Supabase** and **PostgreSQL 16+**. It details database engine parameters, auth claim hooks, storage bucket policies, background cron execution using `pg_cron`, serverless edge function requirements, and disaster recovery strategies.

---

## 1. Supabase Project Configuration

### 1.1 Compute & Database Sizing
- **PostgreSQL Version**: 16.1+
- **Primary Hosting Region**: `ap-south-1` (Mumbai) or `me-central-1` (Dubai) — selected based on primary recruitment market latency constraints.
- **Compute Tier**: Minimum **Small (2 vCPU, 2GB RAM)** for Staging; **Medium / Large (4+ vCPU, 8GB+ RAM)** for Production.

### 1.2 Connection Pooling (Supavisor)
- **Transaction Mode Connection String**: Port `6543` (Used by stateless Next.js Serverless Edge Functions / API routes).
- **Session Mode Connection String**: Port `5432` (Used for long-running database migration scripts and DDL executions).
- **Pool Size Configuration**:
  - `default_pool_size`: `20`
  - `max_client_conn`: `300`
  - `pool_mode`: `transaction`

---

## 2. Required PostgreSQL Extensions

```sql
-- Core Extensions Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation utilities
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Encrypted string & hash functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Trigram GIN fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Composite GIN indexing for array + tenant columns
CREATE EXTENSION IF NOT EXISTS "pg_cron";    -- Scheduled cron job execution within Postgres
CREATE EXTENSION IF NOT EXISTS "pg_net";     -- Asynchronous HTTP requests from DB triggers
```

---

## 3. Auth Configuration & Custom JWT Claims

Supabase Auth is configured to automatically inject `agency_id` and `user_role` into every user's Access Token (JWT) upon login using a Custom Access Token Hook.

### 3.1 Custom Claims Injection Hook (`custom_access_token_hook`)

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_agency_id uuid;
  assigned_role varchar(64);
BEGIN
  -- Fetch target agency_id and highest user role
  SELECT u.agency_id, r.role_name::text INTO user_agency_id, assigned_role
  FROM public.users u
  LEFT JOIN public.user_roles r ON u.user_id = r.user_id
  WHERE u.user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';
  
  -- Inject custom JWT claims for RLS enforcement
  claims := jsonb_set(claims, '{agency_id}', to_jsonb(user_agency_id));
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(assigned_role, 'RECRUITER')));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to Supabase auth admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### 3.2 Token TTL & Authentication Policies
- **Access Token Life (JWT)**: `3600 seconds` (1 Hour)
- **Refresh Token Life**: `2,592,000 seconds` (30 Days)
- **Magic Link Token Expiry**: `900 seconds` (15 Minutes) — used for zero-login Client HR candidate reviews and Candidate Prep Kits.
- **MFA Enforcement**: Enforced via TOTP for `AGENCY_FOUNDER` and `FINANCE_ADMIN` roles.

---

## 4. Storage Bucket Design & Security Policies

RecruitOS maintains 4 distinct private/public cloud storage buckets in Supabase Storage.

```
/storage
  ├── candidate-resumes/        (Private) RAW & Sanitized CVs, Portfolios
  ├── compliance-documents/     (Private) IDs, Relieving Letters, Signed Offers
  ├── interview-recordings/     (Private) Audio debriefs & video prep files
  └── agency-branding-assets/   (Public)  Logos, Favicons, Storefront Teasers
```

### 4.1 Storage Bucket Configuration Table

| Bucket ID | Access Control | Max File Size | Allowed MIME Types |
|---|---|---|---|
| `candidate-resumes` | Private (RLS) | 25 MB | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `compliance-documents` | Private (RLS) | 10 MB | `application/pdf`, `image/png`, `image/jpeg` |
| `interview-recordings` | Private (RLS) | 100 MB | `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/webm` |
| `agency-branding-assets` | Public Read | 5 MB | `image/png`, `image/jpeg`, `image/svg+xml`, `image/x-icon` |

### 4.2 Storage RLS Policy (Multi-Tenant Folder Path Isolation)
Every file uploaded to private buckets MUST be prefixed with the tenant `agency_id` as the top-level folder name (e.g. `candidate-resumes/{agency_id}/{candidate_id}/resume.pdf`).

```sql
-- Storage RLS: Tenant Isolation for Candidate Resumes Bucket
CREATE POLICY "Tenant Storage Isolation for Resumes"
ON storage.objects FOR ALL USING (
  bucket_id = 'candidate-resumes'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'agency_id')
);
```

---

## 5. RLS Deployment Strategy

1. **Enable RLS on All Tables**: Executed via `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.
2. **Session Context Function**: Uses `current_agency_id()` helper to resolve current agency tenant ID from JWT claims or local session variables.
3. **Bypass for Service Role**: Background workers (e.g. notification cron dispatchers) executing with Supabase `service_role` key bypass RLS policies automatically.

---

## 6. JWT Claim Structure Reference

```json
{
  "aud": "authenticated",
  "exp": 1770000000,
  "sub": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  "email": "recruiter@apexagency.com",
  "role": "authenticated",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "first_name": "Rahul",
    "last_name": "Sharma"
  },
  "agency_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "user_role": "RECRUITER"
}
```

---

## 7. Migration Execution Order

To prevent foreign key dependency errors during schema deployment, migrations MUST execute in the following exact order:

1. **Migration 001**: Enable Extensions (`uuid-ossp`, `pgcrypto`, `pg_trgm`, `btree_gin`, `pg_cron`, `pg_net`).
2. **Migration 002**: Create Custom ENUM Types (16 ENUMs).
3. **Migration 003**: Create Helper Functions (`current_agency_id`, `update_updated_at_column`).
4. **Migration 004**: Create Base Tenant Entities (`agencies`, `users`, `user_roles`, `auth_sessions`).
5. **Migration 005**: Create Agency Config Entities (`agency_branding`, `agency_job_board_credentials`).
6. **Migration 006**: Create Candidate Domain Entities (`candidate_records`, `candidate_documents`, `candidate_relationships`, `candidate_ownership_logs`).
7. **Migration 007**: Create Recruitment Pipeline Entities (`clients`, `client_contacts`, `job_mandates`, `job_prep_kits`, `candidate_submissions`, `pipeline_sla_logs`).
8. **Migration 008**: Create Communication & Feedback Entities (`communication_templates`, `communication_logs`, `client_portal_tokens`, `proposed_interview_slots`, `interview_schedules`, `candidate_prep_logs`, `candidate_interview_feedback`).
9. **Migration 009**: Create Compliance & Finance Entities (`notice_period_trackers`, `notice_period_pulse_responses`, `candidate_compliance_docs`, `job_offer_audits`, `client_hr_handoffs`, `probation_guarantee_trackers`, `partner_mandate_shares`, `partner_candidate_submissions`, `candidate_ownership_arbitrations`, `partner_split_ledgers`, `invoice_records`, `financial_vouchers`, `financial_audit_logs`).
10. **Migration 010**: Create Storefront & System Log Entities (`agency_storefront_profiles`, `inbound_client_mandates`, `storefront_talent_showcases`, `storefront_candidate_applications`, `system_activity_logs`, `notification_queues`, `file_storage_records`).
11. **Migration 011**: Create Indexes & Triggers (54 Performance Indexes + `updated_at` Triggers).
12. **Migration 012**: Enable RLS & Apply Tenant Isolation Policies (42 RLS Policies).
13. **Migration 013**: Register Supabase Auth JWT Claim Hook (`custom_access_token_hook`).

---

## 8. Supabase Edge Functions Requirements

Serverless Edge Functions (TypeScript / Deno) deployed to Supabase Edge Network for low-latency specialized tasks:

| Function Name | Trigger | Memory / Timeout | Description |
|---|---|---|---|
| `resume-parser` | Storage Upload Event / Webhook | 512 MB / 30s | Invokes LLM resume parsing service to extract skills, experience, and contact data into `parsed_json`. |
| `whatsapp-webhook` | Inbound HTTP Webhook | 256 MB / 10s | Receives incoming Meta WABA messages and status receipts (`DELIVERED`, `READ`) and logs to `communication_logs`. |
| `client-zip-handoff` | On-Demand HTTP Request | 512 MB / 60s | Streams and bundles all candidate compliance documents into a secure encrypted ZIP package for Client HR. |
| `offer-audit-lock` | DB Trigger / API Call | 256 MB / 15s | Validates candidate offered CTC against contract fee baseline and locks invoice draft in `invoice_records`. |

---

## 9. Cron Job Requirements (`pg_cron`)

Background automation tasks registered in `pg_cron`:

```sql
-- Schedule 1: Pipeline Stage SLA Monitor (Runs every 15 minutes)
SELECT cron.schedule(
  'cron_sla_watchdog',
  '*/15 * * * *',
  $$
    UPDATE candidate_submissions
    SET sla_status = CASE
      WHEN stage = 'SUBMITTED_TO_CLIENT' AND (NOW() - stage_entered_at) > INTERVAL '48 hours' THEN 'BREACHED'::sla_status
      WHEN stage = 'SUBMITTED_TO_CLIENT' AND (NOW() - stage_entered_at) > INTERVAL '24 hours' THEN 'WARNING'::sla_status
      ELSE sla_status
    END
    WHERE stage IN ('SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED') AND sla_status != 'BREACHED';
  $$
);

-- Schedule 2: Daily Post-Offer Retention Radar Countdown (Runs daily at 00:00 UTC)
SELECT cron.schedule(
  'cron_retention_radar',
  '0 0 * * *',
  $$
    UPDATE notice_period_trackers
    SET days_remaining = GREATEST(0, (expected_joining_date - CURRENT_DATE))
    WHERE days_remaining > 0;
  $$
);

-- Schedule 3: Daily Probation Guarantee Clock Countdown (Runs daily at 01:00 UTC)
SELECT cron.schedule(
  'cron_probation_clock',
  '0 1 * * *',
  $$
    UPDATE probation_guarantee_trackers
    SET days_remaining = GREATEST(0, (guarantee_end_date - CURRENT_DATE))
    WHERE days_remaining > 0 AND is_breached = FALSE;
  $$
);

-- Schedule 4: Notification Queue Dispatch Worker (Runs every minute)
SELECT cron.schedule(
  'cron_notification_queue_worker',
  '* * * * *',
  $$
    -- Calls Edge Function or internal dispatcher via pg_net for PENDING queue items
    SELECT net.http_post(
      url:='https://<project-ref>.functions.supabase.co/dispatch-notifications',
      headers:='{"Content-Type": "application/json"}'::jsonb
    );
  $$
);

-- Schedule 5: Expired Magic Link Token Pruning (Runs daily at 02:00 UTC)
SELECT cron.schedule(
  'cron_expired_token_pruning',
  '0 2 * * *',
  $$
    DELETE FROM client_portal_tokens WHERE expires_at < NOW();
    DELETE FROM partner_mandate_shares WHERE expires_at < NOW();
  $$
);
```

---

## 10. File Upload Architecture

1. **Presigned Upload URLs**: Frontend calls API to obtain a short-lived (15-minute) S3/Supabase Storage presigned upload URL.
2. **Binary Magic-Number Scanning**: File uploads verify header magic bytes (`%PDF-`, `PK\x03\x04`, `\xFF\xD8\xFF`) before inserting records into `file_storage_records`.
3. **Asynchronous Malware Scan**: Uploaded files set `is_virus_scanned = FALSE` until background scanner updates status.

---

## 11. Backup & Recovery Strategy

- **Point-in-Time Recovery (PITR)**: Enabled with **7-day retention** (1-second granularity recovery window).
- **Automated Physical WAL Archiving**: Continuous Write-Ahead Log streaming to secondary region.
- **Nightly Logical Backups**: Nightly `pg_dump` dumps exported to AES-256 encrypted cold bucket.
- **Target RPO (Recovery Point Objective)**: **< 5 Minutes**.
- **Target RTO (Recovery Time Objective)**: **< 30 Minutes**.
