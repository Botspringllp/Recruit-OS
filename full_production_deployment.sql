-- RecruitOS Consolidated Full Production Deployment Script
-- Target: Supabase Cloud PostgreSQL 15.8 (Project Ref: vlyfnzvlgftbkqtcbbck)


-- ============================================================
-- SECTION: 01_extensions.sql
-- ============================================================
-- RecruitOS Deployment Phase 1: Extensions Setup
-- PostgreSQL 15 / Supabase Cloud Compatible

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";



-- ============================================================
-- SECTION: 02_enums.sql
-- ============================================================
-- RecruitOS Deployment Phase 2: Domain ENUM Custom Data Types

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_tier') THEN
        CREATE TYPE agency_tier AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('AGENCY_FOUNDER', 'RECRUITER', 'CLIENT_HR', 'PARTNER_RECRUITER', 'FINANCE_ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_status') THEN
        CREATE TYPE candidate_status AS ENUM ('NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'PLACED', 'REJECTED', 'ON_HOLD', 'BLACKLISTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mandate_status') THEN
        CREATE TYPE mandate_status AS ENUM ('DRAFT', 'OPEN', 'ACTIVE', 'ON_HOLD', 'FILLED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_stage') THEN
        CREATE TYPE pipeline_stage AS ENUM ('SCREENED', 'SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'COMPLIANCE_AUDIT', 'JOINED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sla_status') THEN
        CREATE TYPE sla_status AS ENUM ('ON_TRACK', 'WARNING', 'BREACHED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_type') THEN
        CREATE TYPE interview_type AS ENUM ('INTERNAL_SCREENING', 'CLIENT_ROUND_1', 'CLIENT_ROUND_2', 'TECHNICAL_ASSESSMENT', 'HR_ROUND', 'FINAL_MANAGERIAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_mode') THEN
        CREATE TYPE interview_mode AS ENUM ('GOOGLE_MEET', 'MS_TEAMS', 'ZOOM', 'PHONE', 'IN_PERSON');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_category') THEN
        CREATE TYPE doc_category AS ENUM ('RAW_RESUME', 'SANITIZED_RESUME', 'OFFER_LETTER', 'PAYSLIP', 'GOVT_ID', 'PORTFOLIO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_type') THEN
        CREATE TYPE voucher_type AS ENUM ('RECEIPT', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_period_status') THEN
        CREATE TYPE notice_period_status AS ENUM ('SERVING', 'BUYOUT_REQUESTED', 'BUYOUT_APPROVED', 'COMPLETED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'arbitration_status') THEN
        CREATE TYPE arbitration_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('EMAIL', 'WHATSAPP', 'IN_APP', 'WEBHOOK');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_direction') THEN
        CREATE TYPE communication_direction AS ENUM ('INBOUND', 'OUTBOUND');
    END IF;
END $$;



-- ============================================================
-- SECTION: 03_functions.sql
-- ============================================================
-- RecruitOS Deployment Phase 3: Session Functions & Triggers

-- Function 1: Resolves active agency context ID
CREATE OR REPLACE FUNCTION current_agency_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_agency_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: Automated updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Supabase Auth JWT Custom Access Token Hook
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



-- ============================================================
-- SECTION: 04_tables.sql
-- ============================================================
-- RecruitOS Deployment Phase 4: 43 Domain Tables (Strict Topological Sequence)

-- 1. Agencies (Tenant Core)
CREATE TABLE IF NOT EXISTS agencies (
    agency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    tier agency_tier NOT NULL DEFAULT 'STARTER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    role user_role NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Auth Sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    jwt_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Agency Branding
CREATE TABLE IF NOT EXISTS agency_branding (
    branding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL UNIQUE REFERENCES agencies(agency_id) ON DELETE CASCADE,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#4F46E5',
    secondary_color VARCHAR(7) DEFAULT '#06B6D4',
    font_family VARCHAR(100) DEFAULT 'Inter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Agency Job Board Credentials
CREATE TABLE IF NOT EXISTS agency_job_board_credentials (
    credential_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Candidate Records
CREATE TABLE IF NOT EXISTS candidate_records (
    candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    current_city VARCHAR(100),
    total_experience_years DECIMAL(4, 2),
    current_ctc_lpa DECIMAL(10, 2),
    expected_ctc_lpa DECIMAL(10, 2),
    notice_period_days INT,
    status candidate_status DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Candidate Documents
CREATE TABLE IF NOT EXISTS candidate_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    category doc_category NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Candidate Relationships
CREATE TABLE IF NOT EXISTS candidate_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Candidate Ownership Logs
CREATE TABLE IF NOT EXISTS candidate_ownership_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ownership_starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ownership_expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 11. Clients
CREATE TABLE IF NOT EXISTS clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Client Contacts
CREATE TABLE IF NOT EXISTS client_contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Job Mandates
CREATE TABLE IF NOT EXISTS job_mandates (
    mandate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    headcount INT NOT NULL DEFAULT 1,
    min_ctc_lpa DECIMAL(10, 2),
    max_ctc_lpa DECIMAL(10, 2),
    fee_percentage DECIMAL(5, 2) NOT NULL,
    status mandate_status DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Job Prep Kits
CREATE TABLE IF NOT EXISTS job_prep_kits (
    prep_kit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID NOT NULL REFERENCES job_mandates(mandate_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    company_overview TEXT,
    tech_stack_details TEXT,
    key_evaluation_criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Candidate Submissions
CREATE TABLE IF NOT EXISTS candidate_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID NOT NULL REFERENCES job_mandates(mandate_id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    stage pipeline_stage DEFAULT 'SCREENED',
    sla_status sla_status DEFAULT 'ON_TRACK',
    offered_ctc_lpa DECIMAL(10, 2),
    joining_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Pipeline SLA Logs
CREATE TABLE IF NOT EXISTS pipeline_sla_logs (
    sla_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    previous_stage pipeline_stage,
    new_stage pipeline_stage NOT NULL,
    time_in_stage_hours INT NOT NULL,
    sla_status_at_transition sla_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Communication Templates
CREATE TABLE IF NOT EXISTS communication_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    channel notification_channel NOT NULL,
    subject VARCHAR(255),
    body_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Communication Logs
CREATE TABLE IF NOT EXISTS communication_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    channel notification_channel NOT NULL,
    direction communication_direction NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Client Portal Tokens
CREATE TABLE IF NOT EXISTS client_portal_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID NOT NULL REFERENCES job_mandates(mandate_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Proposed Interview Slots
CREATE TABLE IF NOT EXISTS proposed_interview_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    slot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Interview Schedules
CREATE TABLE IF NOT EXISTS interview_schedules (
    interview_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    round_type interview_type NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link TEXT,
    mode interview_mode DEFAULT 'GOOGLE_MEET',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Candidate Prep Logs
CREATE TABLE IF NOT EXISTS candidate_prep_logs (
    prep_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interview_schedules(interview_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    prep_completed BOOLEAN DEFAULT FALSE,
    recruiter_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. Candidate Interview Feedback
CREATE TABLE IF NOT EXISTS candidate_interview_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interview_schedules(interview_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    strengths TEXT,
    concerns TEXT,
    recommendation VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. Notice Period Trackers
CREATE TABLE IF NOT EXISTS notice_period_trackers (
    tracker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    resignation_date DATE,
    official_last_working_day DATE,
    buyout_status notice_period_status DEFAULT 'SERVING',
    risk_level VARCHAR(20) DEFAULT 'LOW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. Notice Period Pulse Responses
CREATE TABLE IF NOT EXISTS notice_period_pulse_responses (
    pulse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID NOT NULL REFERENCES notice_period_trackers(tracker_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    candidate_sentiment_score INT CHECK (candidate_sentiment_score BETWEEN 1 AND 10),
    counter_offer_detected BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. Candidate Compliance Docs
CREATE TABLE IF NOT EXISTS candidate_compliance_docs (
    doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. Job Offer Audits
CREATE TABLE IF NOT EXISTS job_offer_audits (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    offered_fixed_ctc DECIMAL(10, 2) NOT NULL,
    offered_variable_ctc DECIMAL(10, 2) DEFAULT 0.00,
    joining_bonus DECIMAL(10, 2) DEFAULT 0.00,
    offer_issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 28. Client HR Handoffs
CREATE TABLE IF NOT EXISTS client_hr_handoffs (
    handoff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    dossier_pdf_path TEXT,
    accepted_by_hr BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. Probation Guarantee Trackers
CREATE TABLE IF NOT EXISTS probation_guarantee_trackers (
    guarantee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    joining_date DATE NOT NULL,
    guarantee_period_days INT DEFAULT 90,
    guarantee_expires_at DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. Partner Mandate Shares
CREATE TABLE IF NOT EXISTS partner_mandate_shares (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID NOT NULL REFERENCES job_mandates(mandate_id) ON DELETE CASCADE,
    origin_agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    partner_agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    split_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 31. Partner Candidate Submissions
CREATE TABLE IF NOT EXISTS partner_candidate_submissions (
    partner_sub_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES partner_mandate_shares(share_id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    partner_agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 32. Candidate Ownership Arbitrations
CREATE TABLE IF NOT EXISTS candidate_ownership_arbitrations (
    arbitration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    claiming_agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    disputing_agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    status arbitration_status DEFAULT 'PENDING',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 33. Partner Split Ledgers
CREATE TABLE IF NOT EXISTS partner_split_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    partner_agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    total_fee_amount DECIMAL(12, 2) NOT NULL,
    partner_share_amount DECIMAL(12, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34. Invoice Records
CREATE TABLE IF NOT EXISTS invoice_records (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    offer_audit_id UUID REFERENCES job_offer_audits(audit_id),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    gross_amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    status invoice_status DEFAULT 'DRAFT',
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 35. Financial Vouchers
CREATE TABLE IF NOT EXISTS financial_vouchers (
    voucher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES partner_split_ledgers(ledger_id),
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    type voucher_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 36. Financial Audit Logs
CREATE TABLE IF NOT EXISTS financial_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoice_records(invoice_id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 37. Agency Storefront Profiles
CREATE TABLE IF NOT EXISTS agency_storefront_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL UNIQUE REFERENCES agencies(agency_id) ON DELETE CASCADE,
    tagline VARCHAR(255),
    about_text TEXT,
    banner_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 38. Inbound Client Mandates
CREATE TABLE IF NOT EXISTS inbound_client_mandates (
    inbound_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    mandate_title VARCHAR(255) NOT NULL,
    details TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 39. Storefront Talent Showcases
CREATE TABLE IF NOT EXISTS storefront_talent_showcases (
    showcase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE,
    masked_title VARCHAR(255) NOT NULL,
    anonymized_summary TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 40. Storefront Candidate Applications
CREATE TABLE IF NOT EXISTS storefront_candidate_applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    resume_file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 41. System Activity Logs
CREATE TABLE IF NOT EXISTS system_activity_logs (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(agency_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 42. Notification Queues
CREATE TABLE IF NOT EXISTS notification_queues (
    queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status notification_status DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 43. File Storage Records
CREATE TABLE IF NOT EXISTS file_storage_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
    bucket_name VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- SECTION: 05_indexes.sql
-- ============================================================
-- RecruitOS Deployment Phase 5: Foreign Key, Tenant Isolation & Trigram Search Indexes

-- Tenant Isolation Indexes (agency_id B-Tree)
CREATE INDEX IF NOT EXISTS idx_users_agency ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_agency ON user_roles(agency_id);
CREATE INDEX IF NOT EXISTS idx_candidate_records_agency ON candidate_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_job_mandates_agency ON job_mandates(agency_id);
CREATE INDEX IF NOT EXISTS idx_candidate_submissions_agency ON candidate_submissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_agency ON interview_schedules(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_agency ON invoice_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_notification_queues_agency ON notification_queues(agency_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_logs_agency ON system_activity_logs(agency_id);

-- Foreign Key Composite Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_submissions_mandate_stage ON candidate_submissions(agency_id, mandate_id, stage);
CREATE INDEX IF NOT EXISTS idx_candidate_submissions_candidate ON candidate_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_submission ON interview_schedules(submission_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_partner_split_ledgers_submission ON partner_split_ledgers(submission_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_client ON invoice_records(client_id);

-- Trigram Fast Search Indexes (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_candidate_records_name_trgm ON candidate_records USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_mandates_title_trgm ON job_mandates USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm ON clients USING gin (company_name gin_trgm_ops);



-- ============================================================
-- SECTION: 06_triggers.sql
-- ============================================================
-- RecruitOS Deployment Phase 6: Automated Updated_At Timestamp Triggers

CREATE OR REPLACE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_agency_branding_updated_at BEFORE UPDATE ON agency_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_candidate_records_updated_at BEFORE UPDATE ON candidate_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_job_mandates_updated_at BEFORE UPDATE ON job_mandates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_candidate_submissions_updated_at BEFORE UPDATE ON candidate_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ============================================================
-- SECTION: 07_rls.sql
-- ============================================================
-- RecruitOS Deployment Phase 7: Enable Row Level Security (RLS) & Tenant Isolation Policies

-- 1. Enable RLS on all 43 tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_job_board_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_ownership_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_prep_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_sla_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_prep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_period_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_period_pulse_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_compliance_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offer_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_hr_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE probation_guarantee_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_mandate_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_candidate_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_ownership_arbitrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_split_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_storefront_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_client_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_talent_showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_candidate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_storage_records ENABLE ROW LEVEL SECURITY;

-- 2. Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_agencies ON agencies;
CREATE POLICY tenant_isolation_agencies ON agencies
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_candidate_records ON candidate_records;
CREATE POLICY tenant_isolation_candidate_records ON candidate_records
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_job_mandates ON job_mandates;
CREATE POLICY tenant_isolation_job_mandates ON job_mandates
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_candidate_submissions ON candidate_submissions;
CREATE POLICY tenant_isolation_candidate_submissions ON candidate_submissions
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_clients ON clients;
CREATE POLICY tenant_isolation_clients ON clients
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_interview_schedules ON interview_schedules;
CREATE POLICY tenant_isolation_interview_schedules ON interview_schedules
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_invoice_records ON invoice_records;
CREATE POLICY tenant_isolation_invoice_records ON invoice_records
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_notification_queues ON notification_queues;
CREATE POLICY tenant_isolation_notification_queues ON notification_queues
    USING (agency_id = current_agency_id());

DROP POLICY IF EXISTS tenant_isolation_file_storage_records ON file_storage_records;
CREATE POLICY tenant_isolation_file_storage_records ON file_storage_records
    USING (agency_id = current_agency_id());



-- ============================================================
-- SECTION: 08_storage_setup.sql
-- ============================================================
-- RecruitOS Deployment Phase 8: Supabase Storage Buckets & Policies Setup

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('candidate-resumes', 'candidate-resumes', false),
  ('compliance-documents', 'compliance-documents', false),
  ('interview-recordings', 'interview-recordings', false),
  ('agency-branding-assets', 'agency-branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Row Level Security (RLS) Policies
CREATE POLICY candidate_resumes_tenant_policy ON storage.objects
    FOR ALL
    USING (bucket_id = 'candidate-resumes' AND (auth.jwt() -> 'app_metadata' ->> 'agency_id')::uuid = current_agency_id());

CREATE POLICY compliance_documents_tenant_policy ON storage.objects
    FOR ALL
    USING (bucket_id = 'compliance-documents' AND (auth.jwt() -> 'app_metadata' ->> 'agency_id')::uuid = current_agency_id());

CREATE POLICY interview_recordings_tenant_policy ON storage.objects
    FOR ALL
    USING (bucket_id = 'interview-recordings' AND (auth.jwt() -> 'app_metadata' ->> 'agency_id')::uuid = current_agency_id());

CREATE POLICY agency_branding_tenant_policy ON storage.objects
    FOR SELECT
    USING (bucket_id = 'agency-branding-assets');



-- ============================================================
-- SECTION: 09_cron_jobs.sql
-- ============================================================
-- RecruitOS Deployment Phase 9: Automated Cron Jobs (pg_cron)

CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- SLA Evaluation Routine
CREATE OR REPLACE PROCEDURE evaluate_candidate_sla_statuses()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark candidate submissions as BREACHED if in SCREENED stage > 48 hours
  UPDATE candidate_submissions
  SET sla_status = 'BREACHED'
  WHERE stage = 'SCREENED'
    AND created_at < (CURRENT_TIMESTAMP - INTERVAL '48 hours')
    AND sla_status != 'BREACHED';

  -- Mark candidate submissions as WARNING if in SCREENED stage > 24 hours
  UPDATE candidate_submissions
  SET sla_status = 'WARNING'
  WHERE stage = 'SCREENED'
    AND created_at < (CURRENT_TIMESTAMP - INTERVAL '24 hours')
    AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '48 hours')
    AND sla_status = 'ON_TRACK';
END;
$$;

-- Schedule pg_cron evaluation job every 15 minutes
SELECT cron.schedule(
  'check-pipeline-sla-breaches-job',
  '*/15 * * * *',
  $$ CALL evaluate_candidate_sla_statuses(); $$
);


