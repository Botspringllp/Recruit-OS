-- =============================================================================
-- RecruitOS - Complete PostgreSQL 16+ Production & Supabase Compatible Schema
-- =============================================================================
-- Features: Multi-Tenancy (RLS), Auto-Updated Timestamps, Soft Deletes,
--          Audit Activity Feeds, Asynchronous Notification Queues.
-- =============================================================================

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================================================
-- 1. ENUM DEFINITIONS
-- =============================================================================

CREATE TYPE agency_status AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL');
CREATE TYPE subscription_tier AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');
CREATE TYPE user_role AS ENUM ('AGENCY_FOUNDER', 'RECRUITER', 'CLIENT_HR', 'PARTNER_RECRUITER', 'FINANCE_ADMIN');
CREATE TYPE candidate_source AS ENUM ('DIRECT_INTAKE', 'PARTNER', 'STOREFRONT', 'SILVER_MEDALIST');
CREATE TYPE candidate_ownership_status AS ENUM ('ACTIVE', 'STALE', 'UNASSIGNED');
CREATE TYPE pipeline_stage AS ENUM ('SCREENED', 'SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'COMPLIANCE_AUDIT', 'JOINED', 'REJECTED');
CREATE TYPE sla_status AS ENUM ('HEALTHY', 'WARNING', 'BREACHED');
CREATE TYPE counter_offer_risk AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE invoice_status AS ENUM ('GENERATED', 'SENT_TO_CLIENT', 'OVERDUE', 'PAID', 'CANCELLED');
CREATE TYPE settlement_status AS ENUM ('UNBILLED', 'AWAITING_COLLECTION', 'READY_FOR_PAYOUT', 'SETTLED');
CREATE TYPE comm_channel AS ENUM ('WHATSAPP', 'EMAIL');
CREATE TYPE comm_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE comm_delivery_status AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE notification_channel AS ENUM ('WHATSAPP', 'EMAIL', 'IN_APP');
CREATE TYPE dispatch_status AS ENUM ('PENDING', 'PROCESSING', 'DISPATCHED', 'FAILED');
CREATE TYPE doc_category AS ENUM ('RAW_RESUME', 'SANITIZED_RESUME', 'PORTFOLIO', 'COMPLIANCE_ID', 'RELIEVING_LETTER', 'OFFER_LETTER');

-- =============================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- =============================================================================

-- Helper Function to resolve current agency tenant ID from session / Supabase JWT
CREATE OR REPLACE FUNCTION current_agency_id() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_agency_id', true), '')::UUID,
        NULLIF(current_setting('request.jwt.claims', true)::json ->> 'agency_id', '')::UUID
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. IDENTITY & AGENCY CORE DOMAIN
-- =============================================================================

CREATE TABLE agencies (
    agency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    status agency_status NOT NULL DEFAULT 'ACTIVE',
    subscription_tier subscription_tier NOT NULL DEFAULT 'ENTERPRISE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trg_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_tenant ON users(agency_id, created_at DESC);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE user_roles (
    role_assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    role_name user_role NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_user_roles_user_role UNIQUE (user_id, role_name)
);

CREATE TABLE auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id, expires_at);

-- =============================================================================
-- 4. AGENCY BRANDING & INTEGRATIONS DOMAIN
-- =============================================================================

CREATE TABLE agency_branding (
    branding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL UNIQUE REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    logo_url VARCHAR(512) NULL,
    favicon_url VARCHAR(512) NULL,
    primary_color VARCHAR(16) NOT NULL DEFAULT '#0F172A',
    accent_color VARCHAR(16) NOT NULL DEFAULT '#2563EB',
    custom_domain VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_agency_branding_updated_at BEFORE UPDATE ON agency_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE agency_job_board_credentials (
    credential_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    platform_name VARCHAR(64) NOT NULL,
    encrypted_api_key TEXT NOT NULL,
    account_username VARCHAR(128) NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_job_board_tenant_platform UNIQUE (agency_id, platform_name)
);

-- =============================================================================
-- 5. CANDIDATE DOMAIN
-- =============================================================================

CREATE TABLE candidate_records (
    candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    assigned_recruiter_id UUID NULL REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    current_company VARCHAR(255) NULL,
    current_designation VARCHAR(255) NULL,
    total_experience_years NUMERIC(4,1) NULL,
    notice_period_days INTEGER NOT NULL DEFAULT 60,
    current_ctc_lpa NUMERIC(10,2) NULL,
    expected_ctc_lpa NUMERIC(10,2) NULL,
    current_location VARCHAR(128) NULL,
    preferred_locations TEXT[] NULL,
    primary_skills TEXT[] NOT NULL DEFAULT '{}',
    sanitized_summary TEXT NULL,
    source candidate_source NOT NULL DEFAULT 'DIRECT_INTAKE',
    ownership_status candidate_ownership_status NOT NULL DEFAULT 'ACTIVE',
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT ux_candidate_agency_phone UNIQUE (agency_id, phone),
    CONSTRAINT ux_candidate_agency_email UNIQUE (agency_id, email)
);

CREATE INDEX idx_candidate_tenant_created ON candidate_records(agency_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_candidate_skills_gin ON candidate_records USING GIN (primary_skills);
CREATE INDEX idx_candidate_locations_gin ON candidate_records USING GIN (preferred_locations);
CREATE TRIGGER trg_candidate_records_updated_at BEFORE UPDATE ON candidate_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE candidate_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
    document_type doc_category NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    parsed_json JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_candidate_docs_candidate ON candidate_documents(candidate_id, document_type);
CREATE INDEX idx_candidate_docs_jsonb ON candidate_documents USING GIN (parsed_json);

CREATE TABLE candidate_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
    related_candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
    relationship_type VARCHAR(64) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_ownership_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
    previous_recruiter_id UUID NULL REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    new_recruiter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    reason TEXT NOT NULL,
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. RECRUITMENT PIPELINE DOMAIN
-- =============================================================================

CREATE TABLE clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(128) NULL,
    website VARCHAR(255) NULL,
    standard_fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 8.33,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_clients_tenant ON clients(agency_id, company_name) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE client_contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NULL,
    designation VARCHAR(128) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_mandates (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    lead_recruiter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    title VARCHAR(255) NOT NULL,
    headcount INTEGER NOT NULL DEFAULT 1,
    min_ctc_lpa NUMERIC(10,2) NULL,
    max_ctc_lpa NUMERIC(10,2) NULL,
    location VARCHAR(128) NOT NULL,
    job_description_raw TEXT NOT NULL,
    sanitized_description TEXT NULL,
    fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 8.33,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_mandates_tenant_status ON job_mandates(agency_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_job_mandates_updated_at BEFORE UPDATE ON job_mandates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE job_prep_kits (
    kit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    job_id UUID NOT NULL REFERENCES job_mandates(job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    company_overview TEXT NOT NULL,
    interview_process TEXT NOT NULL,
    behavioral_tips TEXT NULL,
    technical_faqs TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    job_id UUID NOT NULL REFERENCES job_mandates(job_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    stage pipeline_stage NOT NULL DEFAULT 'SCREENED',
    rejection_reason VARCHAR(128) NULL,
    rejection_feedback TEXT NULL,
    stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sla_status sla_status NOT NULL DEFAULT 'HEALTHY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_submission_job_candidate UNIQUE (job_id, candidate_id)
);

CREATE INDEX idx_submissions_tenant_stage ON candidate_submissions(agency_id, stage, stage_entered_at);
CREATE INDEX idx_submissions_sla_aging ON candidate_submissions(stage, stage_entered_at) WHERE stage IN ('SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED');
CREATE TRIGGER trg_candidate_submissions_updated_at BEFORE UPDATE ON candidate_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE pipeline_sla_logs (
    sla_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    stage pipeline_stage NOT NULL,
    hours_elapsed NUMERIC(6,2) NOT NULL,
    sla_event VARCHAR(32) NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. COMMUNICATION & MAGIC LINK DOMAIN
-- =============================================================================

CREATE TABLE communication_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    channel comm_channel NOT NULL,
    name VARCHAR(128) NOT NULL,
    subject_template VARCHAR(255) NULL,
    body_template TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE communication_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    candidate_id UUID NULL REFERENCES candidate_records(candidate_id) ON DELETE SET NULL ON UPDATE CASCADE,
    job_id UUID NULL REFERENCES job_mandates(job_id) ON DELETE SET NULL ON UPDATE CASCADE,
    sent_by_user_id UUID NULL REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    channel comm_channel NOT NULL,
    direction comm_direction NOT NULL,
    sender_identifier VARCHAR(255) NOT NULL,
    recipient_identifier VARCHAR(255) NOT NULL,
    template_name VARCHAR(128) NULL,
    message_body TEXT NOT NULL,
    delivery_status comm_delivery_status NOT NULL DEFAULT 'SENT',
    external_message_id VARCHAR(255) NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comm_logs_candidate ON communication_logs(agency_id, candidate_id, sent_at DESC);
CREATE INDEX idx_comm_logs_ext_id ON communication_logs(external_message_id);

CREATE TABLE client_portal_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    job_id UUID NOT NULL REFERENCES job_mandates(job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    token VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. CLIENT FEEDBACK & INTERVIEW DOMAIN
-- =============================================================================

CREATE TABLE proposed_interview_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    slot_id UUID NULL REFERENCES proposed_interview_slots(slot_id) ON DELETE SET NULL ON UPDATE CASCADE,
    confirmed_start_time TIMESTAMPTZ NOT NULL,
    confirmed_end_time TIMESTAMPTZ NOT NULL,
    meeting_link VARCHAR(512) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_prep_logs (
    prep_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    schedule_id UUID NOT NULL REFERENCES interview_schedules(schedule_id) ON DELETE CASCADE ON UPDATE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_interview_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    schedule_id UUID NOT NULL REFERENCES interview_schedules(schedule_id) ON DELETE CASCADE ON UPDATE CASCADE,
    rating_stars INTEGER NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
    feedback_text TEXT NOT NULL,
    audio_recording_url VARCHAR(512) NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 9. COMPLIANCE & ONBOARDING DOMAIN
-- =============================================================================

CREATE TABLE notice_period_trackers (
    tracker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL UNIQUE REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    offer_accepted_date DATE NOT NULL,
    expected_joining_date DATE NOT NULL,
    notice_duration_days INTEGER NOT NULL,
    days_remaining INTEGER NOT NULL,
    resignation_proof_verified BOOLEAN NOT NULL DEFAULT FALSE,
    counter_offer_risk counter_offer_risk NOT NULL DEFAULT 'LOW',
    last_pulse_response_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notice_tracker_countdown ON notice_period_trackers(expected_joining_date, days_remaining);
CREATE TRIGGER trg_notice_period_trackers_updated_at BEFORE UPDATE ON notice_period_trackers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE notice_period_pulse_responses (
    pulse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    tracker_id UUID NOT NULL REFERENCES notice_period_trackers(tracker_id) ON DELETE CASCADE ON UPDATE CASCADE,
    candidate_status_update TEXT NOT NULL,
    risk_score_assigned counter_offer_risk NOT NULL,
    resignation_proof_url VARCHAR(512) NULL,
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_compliance_docs (
    compliance_doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    document_type doc_category NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_user_id UUID NULL REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_offer_audits (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    submission_id UUID NOT NULL UNIQUE REFERENCES candidate_submissions(submission_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    offered_fixed_ctc NUMERIC(12,2) NOT NULL,
    offered_variable_ctc NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_offered_ctc NUMERIC(12,2) NOT NULL,
    agreed_fee_percentage NUMERIC(5,2) NOT NULL,
    calculated_placement_fee NUMERIC(12,2) NOT NULL,
    ctc_variance_flag BOOLEAN NOT NULL DEFAULT FALSE,
    signed_offer_letter_url VARCHAR(512) NOT NULL,
    audited_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE client_hr_handoffs (
    handoff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    zip_package_url VARCHAR(512) NOT NULL,
    downloaded_by_email VARCHAR(255) NOT NULL,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE probation_guarantee_trackers (
    probation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submission_id UUID NOT NULL UNIQUE REFERENCES candidate_submissions(submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    joining_date DATE NOT NULL,
    guarantee_end_date DATE NOT NULL,
    days_remaining INTEGER NOT NULL,
    is_breached BOOLEAN NOT NULL DEFAULT FALSE,
    breached_at TIMESTAMPTZ NULL,
    replacement_mandate_id UUID NULL REFERENCES job_mandates(job_id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 10. PARTNER COLLABORATION DOMAIN
-- =============================================================================

CREATE TABLE partner_mandate_shares (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    job_id UUID NOT NULL REFERENCES job_mandates(job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    partner_agency_name VARCHAR(255) NOT NULL,
    partner_access_token VARCHAR(128) NOT NULL UNIQUE,
    split_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partner_candidate_submissions (
    partner_submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    share_id UUID NOT NULL REFERENCES partner_mandate_shares(share_id) ON DELETE CASCADE ON UPDATE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_ownership_arbitrations (
    arbitration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    partner_submission_id UUID NOT NULL REFERENCES partner_candidate_submissions(partner_submission_id) ON DELETE CASCADE ON UPDATE CASCADE,
    arbitration_result VARCHAR(32) NOT NULL, -- APPROVED, REJECTED_DUPLICATE
    existing_recruiter_id UUID NULL REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    resolution_notes TEXT NOT NULL,
    arbitrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partner_split_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    submission_id UUID NOT NULL REFERENCES candidate_submissions(submission_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    total_placement_fee NUMERIC(12,2) NOT NULL,
    host_agency_share NUMERIC(12,2) NOT NULL,
    partner_agency_share NUMERIC(12,2) NOT NULL,
    settlement_status settlement_status NOT NULL DEFAULT 'UNBILLED',
    settled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 11. FINANCE & BILLING DOMAIN
-- =============================================================================

CREATE TABLE invoice_records (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    audit_id UUID NOT NULL UNIQUE REFERENCES job_offer_audits(audit_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    invoice_number VARCHAR(64) NOT NULL,
    subtotal_amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_invoice_amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    invoice_status invoice_status NOT NULL DEFAULT 'GENERATED',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT ux_invoice_number_tenant UNIQUE (agency_id, invoice_number)
);

CREATE INDEX idx_invoice_tenant_status ON invoice_records(agency_id, invoice_status, due_date) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_invoice_records_updated_at BEFORE UPDATE ON invoice_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE financial_vouchers (
    voucher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ledger_id UUID NOT NULL REFERENCES partner_split_ledgers(ledger_id) ON DELETE CASCADE ON UPDATE CASCADE,
    voucher_number VARCHAR(64) NOT NULL,
    payout_amount NUMERIC(12,2) NOT NULL,
    payment_reference VARCHAR(128) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE financial_audit_logs (
    fin_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoice_records(invoice_id) ON DELETE CASCADE ON UPDATE CASCADE,
    previous_status invoice_status NOT NULL,
    new_status invoice_status NOT NULL,
    modified_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 12. STOREFRONT & INBOUND LEAD DOMAIN
-- =============================================================================

CREATE TABLE agency_storefront_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL UNIQUE REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    hero_title VARCHAR(255) NOT NULL,
    hero_subtitle TEXT NULL,
    showcase_metrics_json JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inbound_client_mandates (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    budget_details VARCHAR(255) NULL,
    raw_message TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE storefront_talent_showcases (
    showcase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_records(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
    anonymized_headline VARCHAR(255) NOT NULL,
    skills_teaser TEXT[] NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE storefront_candidate_applications (
    app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    resume_file_url VARCHAR(512) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 13. CROSS-DOMAIN SYSTEMS (ACTIVITY, QUEUE, FILE STORAGE)
-- =============================================================================

CREATE TABLE system_activity_logs (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    actor_id UUID NULL REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    actor_role VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip_address INET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_tenant_entity ON system_activity_logs(agency_id, entity_type, entity_id, created_at DESC);
CREATE INDEX idx_activity_event_type ON system_activity_logs(agency_id, event_type, created_at DESC);
CREATE INDEX idx_activity_metadata_gin ON system_activity_logs USING GIN (metadata);

CREATE TABLE notification_queues (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    channel notification_channel NOT NULL,
    recipient_identifier VARCHAR(255) NOT NULL,
    payload_json JSONB NOT NULL,
    dispatch_status dispatch_status NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_log TEXT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_pending_dispatch ON notification_queues(dispatch_status, scheduled_at) WHERE dispatch_status IN ('PENDING', 'PROCESSING');
CREATE INDEX idx_notification_tenant ON notification_queues(agency_id, created_at DESC);

CREATE TABLE file_storage_records (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
    bucket_name VARCHAR(128) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    is_virus_scanned BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 14. ROW LEVEL SECURITY (RLS) MULTI-TENANT POLICIES
-- =============================================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_job_board_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_prep_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_ownership_logs ENABLE ROW LEVEL SECURITY;
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

-- RLS Isolation Policy for Tenant Agencies
CREATE POLICY tenant_isolation_policy_agencies ON agencies FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_users ON users FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_user_roles ON user_roles FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_branding ON agency_branding FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_creds ON agency_job_board_credentials FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_clients ON clients FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_contacts ON client_contacts FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_mandates ON job_mandates FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_prep_kits ON job_prep_kits FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_candidates ON candidate_records FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_cand_docs ON candidate_documents FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_cand_rel ON candidate_relationships FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_cand_logs ON candidate_ownership_logs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_submissions ON candidate_submissions FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_sla ON pipeline_sla_logs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_comm_tpl ON communication_templates FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_comm_logs ON communication_logs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_portal_tok ON client_portal_tokens FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_slots ON proposed_interview_slots FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_schedules ON interview_schedules FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_prep_logs ON candidate_prep_logs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_feedback ON candidate_interview_feedback FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_notice ON notice_period_trackers FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_pulse ON notice_period_pulse_responses FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_comp_docs ON candidate_compliance_docs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_offer_audits ON job_offer_audits FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_hr_handoffs ON client_hr_handoffs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_probation ON probation_guarantee_trackers FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_part_shares ON partner_mandate_shares FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_part_subs ON partner_candidate_submissions FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_arbitrations ON candidate_ownership_arbitrations FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_part_splits ON partner_split_ledgers FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_invoices ON invoice_records FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_vouchers ON financial_vouchers FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_fin_logs ON financial_audit_logs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_storefront ON agency_storefront_profiles FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_inbound_leads ON inbound_client_mandates FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_showcases ON storefront_talent_showcases FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_storefront_apps ON storefront_candidate_applications FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_activity ON system_activity_logs FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_notifications ON notification_queues FOR ALL USING (agency_id = current_agency_id());
CREATE POLICY tenant_isolation_policy_files ON file_storage_records FOR ALL USING (agency_id = current_agency_id());
