# RecruitOS - Supabase Infrastructure Project Setup Guide

**Target Supabase Project Ref**: `vlyfnzvlgftbkqtcbbck`  
**API Gateway Domain**: `https://vlyfnzvlgftbkqtcbbck.supabase.co`  
**Database Pooler Endpoint**: `aws-0-ap-northeast-1.pooler.supabase.com:6543`  
**PostgreSQL Version**: PostgreSQL 15.8 (x86_64-pc-linux-gnu)  

---

## 1. Project Configuration & Database Region Settings

- **Project Ref**: `vlyfnzvlgftbkqtcbbck`
- **Region**: Asia Pacific (Tokyo / `ap-northeast-1`)
- **Connection Mode**: Shared Transaction Pooler (Port `6543` with `pgbouncer=true` for Prisma app queries) & Direct Session Pooler (Port `5432` for DDL migrations).

---

## 2. Authentication Settings & JWT Claim Hook Setup

### 2.1 Enable Auth Hooks
1. Navigate to **Supabase Dashboard -> Authentication -> Hooks**.
2. Select **Custom Access Token (JWT) Hook**.
3. Point to PostgreSQL function `public.custom_access_token_hook(event jsonb)`.
4. This function injects `agency_id`, `subdomain`, and `user_role` claims directly into user JWT access tokens upon login:
   ```sql
   CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
   RETURNS jsonb
   LANGUAGE plpgsql
   STABLE
   AS $$
   DECLARE
     claims jsonb;
     user_agency_id uuid;
     user_role_name text;
   BEGIN
     claims := event->'claims';
     SELECT agency_id, role INTO user_agency_id, user_role_name
     FROM public.user_roles
     WHERE user_id = (event->>'user_id')::uuid
     LIMIT 1;

     IF user_agency_id IS NOT NULL THEN
       claims := jsonb_set(claims, '{app_metadata, agency_id}', to_jsonb(user_agency_id));
       claims := jsonb_set(claims, '{app_metadata, user_role}', to_jsonb(user_role_name));
     END IF;

     event := jsonb_set(event, '{claims}', claims);
     RETURN event;
   END;
   $$;
   ```

---

## 3. Supabase Storage Bucket Provisioning

Create the following 4 private storage buckets under **Supabase Dashboard -> Storage**:

| Bucket Name | Public Access | Allowed MIME Types | File Size Limit | RLS Enforced |
|---|---|---|---|---|
| `candidate-resumes` | Private (`false`) | PDF, DOCX, DOC, TXT | 15 MB | **YES** (`agency_id` RLS) |
| `compliance-documents` | Private (`false`) | PDF, PNG, JPG, ZIP | 25 MB | **YES** (`agency_id` RLS) |
| `interview-recordings` | Private (`false`) | MP4, WEBM, MP3, WAV | 250 MB | **YES** (`agency_id` RLS) |
| `agency-branding-assets` | Public (`true`) | PNG, JPG, SVG, WEBP | 5 MB | **YES** (`agency_id` RLS) |

---

## 4. `pg_cron` Automated SLA Watchdog Setup

1. In Supabase Dashboard -> **Database -> Extensions**, enable `pg_cron`.
2. Schedule automated SLA compliance check job:
   ```sql
   SELECT cron.schedule(
     'check-pipeline-sla-breaches-job',
     '*/15 * * * *', -- Runs every 15 minutes
     $$ CALL public.evaluate_candidate_sla_statuses(); $$
   );
   ```
