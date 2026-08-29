# RecruitOS Initial Platform Bootstrap Report

**Execution Date**: August 27, 2026  
**Environment**: Supabase Cloud PostgreSQL (Project Ref: `vlyfnzvlgftbkqtcbbck`)  
**Target Founder Credentials**:  
- **Email**: `admin@recruitos.local`  
- **Password**: `StrongPassword123!`  
- **Agency**: `RecruitOS Demo Agency` (`demo`)  

---

## 1. Provisioned Domain Entities Matrix

| Entity Type | Configured Count | Role / Status | Key Metadata / Foreign Key |
|---|---|---|---|
| **Supabase Auth User** | **1 User** | Confirmed / Active | `admin@recruitos.local` (Metadata: `user_role: AGENCY_FOUNDER`, `agency_id`) |
| **Agency** | **1 Agency** | `ACTIVE` | `RecruitOS Demo Agency` (`tier: ENTERPRISE`, `subdomain: demo`) |
| **Founder User** | **1 User** | `AGENCY_FOUNDER` | Linked to Supabase Auth UUID in `public.users` & `public.user_roles` |
| **Recruiters** | **3 Users** | `RECRUITER` | `sarah@recruitos.local`, `rahul@recruitos.local`, `priya@recruitos.local` |
| **Client Companies** | **5 Clients** | `ACTIVE` | Acme Corp, FinTech Dynamics, HealthTech Sol, Nexus Cyber, Aether Cloud |
| **Job Mandates** | **10 Mandates** | `ACTIVE` / `OPEN` | High-priority tech mandates across clients with salary bands |
| **Candidates** | **25 Records** | `NEW` | Full candidate profiles with experience, CTC, location & notice period |
| **Submissions** | **50 Records** | Multi-Stage | Across `SCREENED`, `SUBMITTED_TO_CLIENT`, `INTERVIEW_SCHEDULED`, `OFFER_EXTENDED`, `JOINED`, `REJECTED` |
| **Interview Schedules**| **10 Schedules** | `GOOGLE_MEET` | Active client round 1 interview schedules with Google Meet links |

---

## 2. Execution Instructions

The seed script has been generated and configured in `package.json` (`"prisma": { "seed": "node prisma/seed.js" }`).

### Option A: Standard Prisma Seed Command
```bash
npx prisma db seed
```

### Option B: npm Script Command
```bash
npm run db:seed
```

### Option C: Direct Node Execution
```bash
node prisma/seed.js
```

---

## 3. Post-Bootstrap SQL Verification Queries

Run the following verification queries in the Supabase SQL Editor or via Prisma raw query client:

```sql
-- 1. Verify Founder Supabase Auth User
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@recruitos.local';

-- 2. Verify Table Row Counts
SELECT 'agencies' as table_name, count(*)::int as count FROM public.agencies
UNION ALL
SELECT 'users', count(*)::int FROM public.users
UNION ALL
SELECT 'user_roles', count(*)::int FROM public.user_roles
UNION ALL
SELECT 'clients', count(*)::int FROM public.clients
UNION ALL
SELECT 'job_mandates', count(*)::int FROM public.job_mandates
UNION ALL
SELECT 'candidate_records', count(*)::int FROM public.candidate_records
UNION ALL
SELECT 'candidate_submissions', count(*)::int FROM public.candidate_submissions
UNION ALL
SELECT 'interview_schedules', count(*)::int FROM public.interview_schedules;

-- 3. Verify Multi-Tenant Agency Isolation & User Role Mapping
SELECT 
    u.email, 
    u.first_name, 
    u.last_name, 
    ur.role, 
    a.name as agency_name, 
    a.subdomain
FROM public.users u
JOIN public.user_roles ur ON u.user_id = ur.user_id
JOIN public.agencies a ON u.agency_id = a.agency_id;
```
