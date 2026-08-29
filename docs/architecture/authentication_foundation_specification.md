# RecruitOS - Authentication & Multi-Tenant Foundation Specification

This specification details the core Security, Authentication, and Multi-Tenant Architecture for the RecruitOS platform. It establishes the authentication flows, Supabase Auth integration, session management, JWT claim lifecycles, role-based access control (RBAC), and middleware enforcement rules.

---

## 1. Authentication Flow Overview

RecruitOS supports three primary authentication mechanisms tailored to different user personas:

```
                               ┌────────────────────────────────────────┐
                               │       Recruiter / Founder Login        │
                               │   Email + Password / OAuth + MFA       │
                               └──────────────────┬─────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────┐   ┌────────────────────────────────────────┐   ┌──────────────────────────┐
│ Zero-Login Magic Links   │   │   Supabase Auth Engine + JWT Hook      │   │ External Partner Access  │
│ (Client HR / Candidates) ├──►│  (Injects agency_id & user_role claim) ◄──┤ (Split Partner Tokens)   │
└──────────────────────────┘   └──────────────────┬─────────────────────┘   └──────────────────────────┘
                                                  │
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │ Next.js SSR Middleware & RLS Policies  │
                               │ (SET LOCAL app.current_agency_id = ...)│
                               └────────────────────────────────────────┘
```

1. **Standard Password & OAuth Authentication**: Used by internal agency personnel (`AGENCY_FOUNDER`, `RECRUITER`, `FINANCE_ADMIN`). Supports TOTP-based Multi-Factor Authentication (MFA).
2. **Zero-Login Secure Magic Links**: Used by external `CLIENT_HR` contacts to review submitted candidate profiles, approve interview slots, and complete offer audits without creating a password.
3. **Partner Access Tokens**: Used by `PARTNER_RECRUITER` agencies participating in split-fee job shares via specialized signed URLs.

---

## 2. Supabase Auth Integration (`auth.users` -> `public.users`)

When a user registers or is invited, Supabase Auth creates a record in `auth.users`. A database trigger automatically synchronizes this identity into `public.users`.

```sql
-- Trigger Function: Automatic Sync from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    user_id,
    agency_id,
    email,
    password_hash,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'agency_id')::uuid,
    NEW.email,
    'SUPABASE_AUTH_MANAGED',
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'System'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    TRUE,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

---

## 3. User Registration & Invitation Flows

### 3.1 Agency Self-Serve Registration
1. **Tenant Initialization**: Prospect submits agency registration (`Agency Name`, `Subdomain`, `Founder Email`, `Password`).
2. **Root Record Creation**: API creates `agencies` record with status `TRIAL`.
3. **Founder User Creation**: Supabase Auth creates user with `agency_id` in metadata.
4. **Role Assignment**: Automatically assigns `AGENCY_FOUNDER` role in `user_roles`.

### 3.2 Recruiter Invitation Flow
1. **Founder Invites Recruiter**: Founder inputs recruiter email and assigns initial role (`RECRUITER`).
2. **Invite Token Generation**: System sends Supabase Auth invite link.
3. **Password Setup**: Recruiter clicks link, sets password, and is linked to the parent `agency_id`.

---

## 4. Login & Subdomain Resolution Flow

1. **Subdomain Extraction**: Middleware parses request hostname (e.g. `apex.recruitos.com`).
2. **Agency Verification**: Middleware verifies `apex` subdomain exists and status is `ACTIVE`.
3. **Credential Auth**: Post request to Supabase Auth (`supabase.auth.signInWithPassword`).
4. **JWT Claim Injection**: Supabase runs `custom_access_token_hook`, injecting `agency_id` and `user_role`.
5. **Cookie Storage**: JWT access token stored in secure, `HTTPOnly`, `SameSite=Lax` browser cookie.

---

## 5. Session Management & Refresh Token Strategy

- **Stateless Verification**: Next.js API routes verify JWT signatures locally without hitting database on every request.
- **Refresh Token Rotation**: Supabase Auth rotates refresh tokens upon each renewal. Expired tokens are tracked in `auth_sessions`.
- **Global Logout**: `supabase.auth.signOut()` clears cookies and invalidates session tokens across subdomains.

---

## 6. JWT Claim Lifecycle

```json
{
  "aud": "authenticated",
  "exp": 1770000000,
  "sub": "e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
  "email": "sarah@apexrecruitment.com",
  "role": "authenticated",
  "agency_id": "98765432-10fe-dcba-9876-543210fedcba",
  "user_role": "AGENCY_FOUNDER"
}
```

- **Issuance**: Issued at login or token refresh via `custom_access_token_hook`.
- **Validation**: Middleware decodes token payload and extracts `agency_id`.
- **Database Context Injection**: API route executes `SET LOCAL app.current_agency_id = '98765432-10fe-dcba-9876-543210fedcba'` before executing database queries.

---

## 7. Role-Based Access Control (RBAC) Architecture

RecruitOS enforces 5 explicit roles in `user_roles`:

1. `AGENCY_FOUNDER`: Super-admin within tenant agency. Full CRUD access to candidates, jobs, team members, finance, and white-label branding.
2. `RECRUITER`: Operational recruiter. Full CRUD on assigned candidates, mandates, pipeline stages, and candidate preps. Cannot modify billing or branding.
3. `CLIENT_HR`: External client representative. Read-only access to submitted candidate packages and ability to approve interview slots / offer audits via magic link.
4. `PARTNER_RECRUITER`: External co-broker. Access restricted strictly to shared mandates via `partner_mandate_shares`.
5. `FINANCE_ADMIN`: Financial administrator. Access restricted to invoice records, financial vouchers, and split fee ledgers.

---

## 8. Multi-Tenant Agency Isolation Strategy

Tenant data isolation is enforced at **three distinct layers**:

```
Layer 1: DNS & Subdomain Routing      --> Filters request at Next.js Edge Middleware
Layer 2: API Route Query Isolation     --> Injects `WHERE agency_id = session.agency_id`
Layer 3: PostgreSQL RLS Engine        --> Physical row filtering (`agency_id = current_agency_id()`)
```

- **Payload Protection**: Client APIs reject payloads containing an explicit `agency_id` field; `agency_id` is ALWAYS enforced from the verified JWT claim on the server.

---

## 9. Route Protection Matrix

| Route Pattern | Protection Level | Allowed Roles | Authentication Method |
|---|---|---|---|
| `/login`, `/register` | Public | Unauthenticated | None |
| `/dashboard/*` | Protected | `AGENCY_FOUNDER`, `RECRUITER` | Supabase Auth JWT Cookie |
| `/candidates/*` | Protected | `AGENCY_FOUNDER`, `RECRUITER` | Supabase Auth JWT Cookie |
| `/jobs/*` | Protected | `AGENCY_FOUNDER`, `RECRUITER` | Supabase Auth JWT Cookie |
| `/finance/*` | Restricted | `AGENCY_FOUNDER`, `FINANCE_ADMIN` | Supabase Auth JWT + MFA |
| `/settings/branding` | Admin Only | `AGENCY_FOUNDER` | Supabase Auth JWT Cookie |
| `/portal/review/[token]` | Portal | `CLIENT_HR` | Client Portal Magic Link Token |
| `/partner/share/[token]` | Partner | `PARTNER_RECRUITER` | Partner Access Token |

---

## 10. Next.js Edge Middleware Architecture

The Next.js Edge Middleware (`middleware.ts`) performs the following sequence on every incoming request:

1. **Extract Host Subdomain**: Parses `hostname` to extract agency subdomain.
2. **Session Retrieval**: Validates Supabase auth cookie using `@supabase/ssr`.
3. **JWT Claim Verification**: Ensures `agency_id` in token matches requested tenant subdomain.
4. **Route Guard Check**: Verifies user's `user_role` has required permission for target path.
5. **Session Injection**: Appends `x-agency-id` and `x-user-id` to request headers for downstream API routes.

---

## 11. API Authorization & Anti-Tampering Rules

- **Zero Client Payload Trust**: Never trust `agency_id` passed in JSON payloads or query strings.
- **Service Role Key Boundary**: `SUPABASE_SERVICE_ROLE_KEY` is strictly prohibited in user-facing API routes; it is reserved exclusively for background workers.
- **Audit Logging**: Any authorization failure or attempted cross-tenant access logs an immediate security alert to `system_activity_logs`.
