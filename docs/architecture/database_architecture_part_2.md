# RecruitOS - Database Architecture Specification (Part 2: Deep Schema & Entity Reference)

This document contains the unsummarized, complete Column Definitions, Data Types, Nullability Rules, Default Values, Primary Keys, Foreign Keys, Indexes, and Relationships for all database tables across all 10 platform domains.

---

## 1. Domain 1: Identity & Access

### 1.1 Table: `agencies`
- **Purpose**: Root multi-tenant agency record.
- **Primary Key**: `agency_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**: None (Root Entity)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `agency_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `name` | VARCHAR(255) | NO | None | Legal name of recruitment agency |
  | `subdomain` | VARCHAR(63) | NO | None | Unique tenant prefix (e.g. `apex`), UNIQUE constraint |
  | `status` | VARCHAR(32) | NO | `'ACTIVE'` | Operational status (`ACTIVE`, `SUSPENDED`, `TRIAL`) |
  | `subscription_tier` | VARCHAR(32) | NO | `'ENTERPRISE'` | SaaS tier (`STARTER`, `GROWTH`, `ENTERPRISE`) |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Audit creation timestamp |
  | `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Audit update timestamp |
- **Indexes**:
  - `pk_agencies`: PRIMARY KEY (`agency_id`)
  - `ux_agencies_subdomain`: UNIQUE INDEX (`subdomain`)

---

### 1.2 Table: `users`
- **Purpose**: Internal platform user accounts (Founders, Recruiters, Client HR managers).
- **Primary Key**: `user_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `user_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Multi-tenant isolation owner FK |
  | `email` | VARCHAR(255) | NO | None | User corporate email, UNIQUE constraint |
  | `password_hash` | VARCHAR(255) | NO | None | Argon2id / bcrypt encrypted hash |
  | `first_name` | VARCHAR(128) | NO | None | Given name |
  | `last_name` | VARCHAR(128) | NO | None | Surname / Family name |
  | `phone` | VARCHAR(32) | YES | NULL | Direct mobile contact (E.164) |
  | `is_active` | BOOLEAN | NO | `TRUE` | User active account status |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Account creation timestamp |
- **Indexes**:
  - `pk_users`: PRIMARY KEY (`user_id`)
  - `ux_users_email`: UNIQUE INDEX (`email`)
  - `idx_users_tenant`: B-TREE (`agency_id`, `created_at DESC`)

---

### 1.3 Table: `user_roles`
- **Purpose**: Fine-grained RBAC role assignments for agency users.
- **Primary Key**: `role_assignment_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `user_id` → `users(user_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `role_assignment_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant context |
  | `user_id` | UUID | NO | None | Assigned user FK |
  | `role_name` | VARCHAR(64) | NO | None | Role (`AGENCY_FOUNDER`, `RECRUITER`, `CLIENT_HR`) |
  | `granted_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp assigned |
- **Indexes**:
  - `pk_user_roles`: PRIMARY KEY (`role_assignment_id`)
  - `ux_user_roles_user_role`: UNIQUE INDEX (`user_id`, `role_name`)

---

### 1.4 Table: `auth_sessions`
- **Purpose**: Active JWT login sessions, refresh tokens, and device audit logs.
- **Primary Key**: `session_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `user_id` → `users(user_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `session_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `user_id` | UUID | NO | None | Target user FK |
  | `refresh_token_hash` | VARCHAR(255) | NO | None | Hashed refresh token |
  | `ip_address` | INET | NO | None | Client IP address |
  | `user_agent` | TEXT | YES | NULL | Browser/device user agent |
  | `expires_at` | TIMESTAMPTZ | NO | None | Session expiration timestamp |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Session creation timestamp |
- **Indexes**:
  - `pk_auth_sessions`: PRIMARY KEY (`session_id`)
  - `idx_auth_sessions_token`: B-TREE (`refresh_token_hash`)

---

## 2. Domain 2: Agency & Tenant Config

### 2.1 Table: `agency_branding`
- **Purpose**: Custom white-label branding, logos, theme colors, and portal domain aliases.
- **Primary Key**: `branding_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `branding_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK (UNIQUE) |
  | `logo_url` | VARCHAR(512) | YES | NULL | Public S3 CDN link for agency logo |
  | `favicon_url` | VARCHAR(512) | YES | NULL | Favicon icon URL |
  | `primary_color` | VARCHAR(16) | NO | `'#0F172A'` | Primary brand HEX color |
  | `accent_color` | VARCHAR(16) | NO | `'#2563EB'` | Accent brand HEX color |
  | `custom_domain` | VARCHAR(255) | YES | NULL | Custom CNAME domain (e.g. `careers.apex.com`) |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation timestamp |
- **Indexes**:
  - `pk_agency_branding`: PRIMARY KEY (`branding_id`)
  - `ux_agency_branding_tenant`: UNIQUE INDEX (`agency_id`)

---

### 2.2 Table: `agency_job_board_credentials`
- **Purpose**: Encrypted API integration credentials for external job boards (Naukri, Bayt, LinkedIn, Indeed).
- **Primary Key**: `credential_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `credential_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `platform_name` | VARCHAR(64) | NO | None | Platform (`NAUKRI`, `BAYT`, `LINKEDIN`, `INDEED`) |
  | `encrypted_api_key` | TEXT | NO | None | AES-256 encrypted API key / OAuth secret |
  | `account_username` | VARCHAR(128) | YES | NULL | Board account username |
  | `is_enabled` | BOOLEAN | NO | `TRUE` | Integration toggle flag |
  | `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last configuration update |
- **Indexes**:
  - `pk_job_board_creds`: PRIMARY KEY (`credential_id`)
  - `ux_job_board_tenant_platform`: UNIQUE INDEX (`agency_id`, `platform_name`)

---

## 3. Domain 3: Candidate Domain

### 3.1 Table: `candidate_records`
- **Purpose**: Master repository for candidate talent profiles.
- **Primary Key**: `candidate_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `assigned_recruiter_id` → `users(user_id)` (ON DELETE SET NULL, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `candidate_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant isolation owner FK |
  | `assigned_recruiter_id` | UUID | YES | NULL | Primary recruiter owner |
  | `first_name` | VARCHAR(128) | NO | None | Candidate given name |
  | `last_name` | VARCHAR(128) | NO | None | Candidate surname |
  | `email` | VARCHAR(255) | NO | None | Primary email address |
  | `phone` | VARCHAR(32) | NO | None | Primary phone number (E.164 format) |
  | `current_company` | VARCHAR(255) | YES | NULL | Current employer |
  | `current_designation` | VARCHAR(255) | YES | NULL | Current job title |
  | `total_experience_years` | NUMERIC(4,1) | YES | NULL | Total experience in years |
  | `notice_period_days` | INTEGER | NO | `60` | Official notice period duration |
  | `current_ctc_lpa` | NUMERIC(10,2) | YES | NULL | Current annual CTC (Lakhs / Local) |
  | `expected_ctc_lpa` | NUMERIC(10,2) | YES | NULL | Target expected annual CTC |
  | `current_location` | VARCHAR(128) | YES | NULL | Current city/region |
  | `preferred_locations` | TEXT[] | YES | NULL | Array of preferred cities |
  | `primary_skills` | TEXT[] | NO | `'{}'` | Array of searchable skill tags |
  | `sanitized_summary` | TEXT | YES | NULL | Masked profile bio for client/partner review |
  | `source` | VARCHAR(64) | NO | `'DIRECT_INTAKE'` | Sourcing channel (`DIRECT_INTAKE`, `PARTNER`, `STOREFRONT`, `SILVER_MEDALIST`) |
  | `ownership_status` | VARCHAR(32) | NO | `'ACTIVE'` | Recruiter ownership state (`ACTIVE`, `STALE`, `UNASSIGNED`) |
  | `last_activity_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp of last engagement |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Intake timestamp |
- **Indexes**:
  - `pk_candidate_records`: PRIMARY KEY (`candidate_id`)
  - `ux_candidate_agency_phone`: UNIQUE INDEX (`agency_id`, `phone`)
  - `ux_candidate_agency_email`: UNIQUE INDEX (`agency_id`, `LOWER(email)`)
  - `idx_candidate_tenant_created`: B-TREE (`agency_id`, `created_at DESC`)
  - `idx_candidate_skills_gin`: GIN INDEX (`primary_skills`)
  - `idx_candidate_locations_gin`: GIN INDEX (`preferred_locations`)

---

### 3.2 Table: `candidate_documents`
- **Purpose**: Stores CV binaries, parsed JSON metadata, and portfolio attachments.
- **Primary Key**: `document_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `candidate_id` → `candidate_records(candidate_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `document_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `candidate_id` | UUID | NO | None | Linked candidate FK |
  | `document_type` | VARCHAR(64) | NO | None | Document category (`RAW_RESUME`, `SANITIZED_RESUME`, `PORTFOLIO`) |
  | `file_path` | VARCHAR(512) | NO | None | Private cloud storage bucket key |
  | `file_name` | VARCHAR(255) | NO | None | Original filename |
  | `file_size_bytes` | INTEGER | NO | None | File payload size in bytes |
  | `mime_type` | VARCHAR(128) | NO | None | Verified MIME type (`application/pdf`, etc.) |
  | `parsed_json` | JSONB | YES | NULL | LLM / Regex parser extracted entities |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Upload timestamp |
- **Indexes**:
  - `pk_candidate_documents`: PRIMARY KEY (`document_id`)
  - `idx_candidate_docs_candidate`: B-TREE (`candidate_id`, `document_type`)
  - `idx_candidate_docs_jsonb`: GIN INDEX (`parsed_json`)

---

## 4. Domain 4: Recruitment Pipeline Domain

### 4.1 Table: `clients`
- **Purpose**: Enterprise client corporate records.
- **Primary Key**: `client_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `client_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `company_name` | VARCHAR(255) | NO | None | Client legal corporate name |
  | `industry` | VARCHAR(128) | YES | NULL | Industry sector |
  | `website` | VARCHAR(255) | YES | NULL | Corporate website URL |
  | `standard_fee_percentage` | NUMERIC(5,2) | NO | `8.33` | Contractual placement fee % |
  | `payment_terms_days` | INTEGER | NO | `30` | Invoice payment window (e.g. 30 days) |
  | `status` | VARCHAR(32) | NO | `'ACTIVE'` | Operational status (`ACTIVE`, `INACTIVE`) |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
- **Indexes**:
  - `pk_clients`: PRIMARY KEY (`client_id`)
  - `idx_clients_tenant`: B-TREE (`agency_id`, `company_name`)

---

### 4.2 Table: `job_mandates`
- **Purpose**: Open hiring mandates and job orders.
- **Primary Key**: `job_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `client_id` → `clients(client_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `lead_recruiter_id` → `users(user_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `job_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `client_id` | UUID | NO | None | Hiring employer client FK |
  | `lead_recruiter_id` | UUID | NO | None | Assigned lead recruiter FK |
  | `title` | VARCHAR(255) | NO | None | Mandate role designation |
  | `headcount` | INTEGER | NO | `1` | Open headcount positions |
  | `min_ctc_lpa` | NUMERIC(10,2) | YES | NULL | Minimum annual salary budget |
  | `max_ctc_lpa` | NUMERIC(10,2) | YES | NULL | Maximum annual salary budget |
  | `location` | VARCHAR(128) | NO | None | Primary work location |
  | `job_description_raw` | TEXT | NO | None | Detailed raw JD text |
  | `sanitized_description` | TEXT | YES | NULL | Masked JD for split partner sharing |
  | `fee_percentage` | NUMERIC(5,2) | NO | `8.33` | Contractual fee percentage |
  | `status` | VARCHAR(32) | NO | `'OPEN'` | Status (`OPEN`, `PAUSED`, `FILLED`, `CANCELLED`) |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
- **Indexes**:
  - `pk_job_mandates`: PRIMARY KEY (`job_id`)
  - `idx_mandates_tenant_status`: B-TREE (`agency_id`, `status`, `created_at DESC`)
  - `idx_mandates_client`: B-TREE (`client_id`, `status`)

---

### 4.3 Table: `candidate_submissions`
- **Purpose**: Primary pipeline application state connecting candidate to job mandate.
- **Primary Key**: `submission_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `job_id` → `job_mandates(job_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `candidate_id` → `candidate_records(candidate_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `submission_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `job_id` | UUID | NO | None | Mandate FK |
  | `candidate_id` | UUID | NO | None | Candidate FK |
  | `stage` | VARCHAR(64) | NO | `'SCREENED'` | Stage (`SCREENED`, `SUBMITTED_TO_CLIENT`, `INTERVIEW_SCHEDULED`, `OFFER_EXTENDED`, `COMPLIANCE_AUDIT`, `JOINED`, `REJECTED`) |
  | `rejection_reason` | VARCHAR(128) | YES | NULL | Structured rejection taxonomy |
  | `rejection_feedback` | TEXT | YES | NULL | Detailed client rejection feedback |
  | `stage_entered_at` | TIMESTAMPTZ | NO | `NOW()` | SLA aging clock start timestamp |
  | `sla_status` | VARCHAR(32) | NO | `'HEALTHY'` | SLA timer indicator (`HEALTHY`, `WARNING`, `BREACHED`) |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Submission timestamp |
- **Indexes**:
  - `pk_candidate_submissions`: PRIMARY KEY (`submission_id`)
  - `ux_submission_job_candidate`: UNIQUE INDEX (`job_id`, `candidate_id`)
  - `idx_submissions_tenant_stage`: B-TREE (`agency_id`, `stage`, `stage_entered_at`)
  - `idx_submissions_sla_aging`: B-TREE (`stage`, `stage_entered_at`) WHERE `stage IN ('SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED')`

---

## 5. Domain 5: Compliance, Offer Audits & Retention Radar

### 5.1 Table: `job_offer_audits`
- **Purpose**: Financial verification and fee baseline locking for offered CTC.
- **Primary Key**: `audit_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `submission_id` → `candidate_submissions(submission_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `audited_by_user_id` → `users(user_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `audit_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `submission_id` | UUID | NO | None | Target candidate submission FK (UNIQUE) |
  | `offered_fixed_ctc` | NUMERIC(12,2) | NO | None | Annual fixed component offered |
  | `offered_variable_ctc` | NUMERIC(12,2) | NO | `0.00` | Annual performance bonus component |
  | `total_offered_ctc` | NUMERIC(12,2) | NO | None | Fixed + Variable total CTC |
  | `agreed_fee_percentage` | NUMERIC(5,2) | NO | None | Final contractual fee % |
  | `calculated_placement_fee` | NUMERIC(12,2) | NO | None | Calculated agency revenue fee |
  | `ctc_variance_flag` | BOOLEAN | NO | `FALSE` | Flag set if CTC variance >10% vs mandate |
  | `signed_offer_letter_url` | VARCHAR(512) | NO | None | S3 cloud storage link to signed offer letter |
  | `audited_by_user_id` | UUID | NO | None | Auditor user FK |
  | `audited_at` | TIMESTAMPTZ | NO | `NOW()` | Verification timestamp |
- **Indexes**:
  - `pk_job_offer_audits`: PRIMARY KEY (`audit_id`)
  - `ux_job_offer_audits_submission`: UNIQUE INDEX (`submission_id`)

---

### 5.2 Table: `notice_period_trackers`
- **Purpose**: 90-day post-offer candidate retention radar & drop-off risk monitoring.
- **Primary Key**: `tracker_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `submission_id` → `candidate_submissions(submission_id)` (ON DELETE CASCADE, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `tracker_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Tenant FK |
  | `submission_id` | UUID | NO | None | Submission FK (UNIQUE) |
  | `offer_accepted_date` | DATE | NO | None | Date candidate accepted offer |
  | `expected_joining_date` | DATE | NO | None | Contractual joining date |
  | `notice_duration_days` | INTEGER | NO | None | Total notice period duration |
  | `days_remaining` | INTEGER | NO | None | Real-time remaining countdown days |
  | `resignation_proof_verified` | BOOLEAN | NO | `FALSE` | Resignation acceptance proof flag |
  | `counter_offer_risk` | VARCHAR(32) | NO | `'LOW'` | Calculated risk score (`LOW`, `MEDIUM`, `HIGH`) |
  | `last_pulse_response_at` | TIMESTAMPTZ | YES | NULL | Timestamp of latest candidate pulse check |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
- **Indexes**:
  - `pk_notice_period_trackers`: PRIMARY KEY (`tracker_id`)
  - `ux_notice_trackers_submission`: UNIQUE INDEX (`submission_id`)
  - `idx_notice_tracker_countdown`: B-TREE (`expected_joining_date`, `days_remaining`)

---

## 6. Domain 6: Partner Network & Split Ledgers

### 6.1 Table: `partner_split_ledgers`
- **Purpose**: 50/50 commission split accounting ledger for partner placements.
- **Primary Key**: `ledger_id` (UUID, NOT NULL, DEFAULT `gen_random_uuid()`)
- **Foreign Keys**:
  - `agency_id` → `agencies(agency_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
  - `submission_id` → `candidate_submissions(submission_id)` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- **Columns**:
  | Column Name | Data Type | Nullable | Default Value | Business Rationale / Constraints |
  |---|---|---|---|---|
  | `ledger_id` | UUID | NO | `gen_random_uuid()` | Primary Key |
  | `agency_id` | UUID | NO | None | Host agency tenant FK |
  | `submission_id` | UUID | NO | None | Placed candidate submission FK |
  | `total_placement_fee` | NUMERIC(12,2) | NO | None | Total collected placement fee |
  | `host_agency_share` | NUMERIC(12,2) | NO | None | Host agency 50% split amount |
  | `partner_agency_share` | NUMERIC(12,2) | NO | None | Partner agency 50% split amount |
  | `settlement_status` | VARCHAR(32) | NO | `'UNBILLED'` | Status (`UNBILLED`, `AWAITING_COLLECTION`, `READY_FOR_PAYOUT`, `SETTLED`) |
  | `settled_at` | TIMESTAMPTZ | YES | NULL | Timestamp payout voucher issued |
  | `created_at` | TIMESTAMPTZ | NO | `NOW()` | Ledger entry creation timestamp |
- **Indexes**:
  - `pk_partner_split_ledgers`: PRIMARY KEY (`ledger_id`)
  - `idx_partner_split_tenant_status`: B-TREE (`agency_id`, `settlement_status`)

---

## 7. Comprehensive Relationship Summary

1. **One-to-One (1:1)**:
   - `candidate_submissions` ↔ `job_offer_audits`
   - `candidate_submissions` ↔ `notice_period_trackers`
   - `candidate_submissions` ↔ `probation_guarantee_trackers`
   - `job_offer_audits` ↔ `invoice_records`

2. **One-to-Many (1:N)**:
   - `agencies` → `users`
   - `clients` → `client_contacts`
   - `clients` → `job_mandates`
   - `job_mandates` → `candidate_submissions`
   - `candidate_records` → `candidate_documents`
   - `notice_period_trackers` → `notice_period_pulse_responses`

3. **Many-to-Many (N:M)**:
   - `candidate_records` ↔ `job_mandates` (Intermediated via `candidate_submissions`)
   - `job_mandates` ↔ `partner_agencies` (Intermediated via `partner_mandate_shares`)
