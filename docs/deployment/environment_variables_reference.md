# RecruitOS - Environment Variables Reference

This document defines all required environment variables, configuration keys, secrets, and connection parameters across local development, staging, and production Supabase deployments.

---

## 1. Core Database & Supabase Keys

```env
# =============================================================================
# SUPABASE & POSTGRESQL CONNECTION PARAMETERS
# =============================================================================

# Transaction Pooler Connection String (Port 6543 - Next.js Serverless & Edge Functions)
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Session Connection String (Port 5432 - Migration DDL Execution & Prisma Studio)
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Supabase API URL & Public Anon Key (Client-side browser access)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase Service Role Key (Backend Server-side Admin execution — BYPASSES RLS)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase JWT Secret (Used for verifying JWT tokens server-side)
SUPABASE_JWT_SECRET="your-super-secret-jwt-token-signing-key-32-chars-min"
```

---

## 2. Multi-Tenant & White-Label Domain Config

```env
# Base Platform Domain (Subdomain wildcard matching, e.g. apex.recruitos.com)
NEXT_PUBLIC_APP_DOMAIN="recruitos.com"

# Client HR Zero-Login Portal Magic Link Base URL
NEXT_PUBLIC_CLIENT_PORTAL_URL="https://review.recruitos.com"

# Default Storage CDN Public Endpoint
NEXT_PUBLIC_STORAGE_CDN_URL="https://[PROJECT_REF].supabase.co/storage/v1/object/public"
```

---

## 3. Data Encryption & Security Secrets

```env
# AES-256 Encryption Key for Job Board Encrypted API Credentials (Must be 32 bytes hex)
JOB_BOARD_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Magic Link Token Signing Secret
MAGIC_LINK_SECRET="your-32-character-magic-link-crypto-secret"
```

---

## 4. Communication & Messaging Provider Secrets

```env
# WhatsApp Business API (Meta WABA Credentials)
WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_PHONE_NUMBER_ID="109283746501928"
WHATSAPP_SYSTEM_USER_ACCESS_TOKEN="EAAG..."
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your-webhook-verification-token"

# Email SMTP/IMAP Provider (Resend / SendGrid / AWS SES)
EMAIL_PROVIDER_API_KEY="re_123456789..."
EMAIL_FROM_ADDRESS="no-reply@recruitos.com"
```

---

## 5. AI Resume Parsing Provider Secrets

```env
# AI Parser Endpoint & API Key (OpenAI / Anthropic / Specialized Resume Parser)
RESUME_PARSER_API_KEY="sk-proj-..."
RESUME_PARSER_ENDPOINT="https://api.openai.com/v1/chat/completions"
```

---

## 6. Environment Variable Summary & Access Matrix

| Variable Name | Environment | Access Scope | Sensitivity Level | Description |
|---|---|---|---|---|
| `DATABASE_URL` | Server | Server Only | **CRITICAL** | Transaction Pooled DB URL (Port 6543) |
| `DIRECT_URL` | Server | Server Only | **CRITICAL** | Direct DB URL for migrations (Port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Client + Server | PUBLIC | Supabase Project Gateway URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Client + Server | PUBLIC | Supabase Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Server Only | **EXTREME (Bypasses RLS)** | Admin Service Role Key |
| `SUPABASE_JWT_SECRET` | Server | Server Only | **CRITICAL** | JWT Token Verification Secret |
| `JOB_BOARD_ENCRYPTION_KEY` | Server | Server Only | **CRITICAL** | AES-256 Key for Job Board Creds |
| `WHATSAPP_SYSTEM_USER_ACCESS_TOKEN`| Server | Server Only | **HIGH** | Meta WABA API Token |
