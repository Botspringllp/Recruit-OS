# RecruitOS - Authorization & Role Permissions Matrix

This document defines the Role-Based Access Control (RBAC) permission matrix across all 5 system user roles for the 10 data domains in the RecruitOS platform.

---

## 1. System Roles Summary

- **`AGENCY_FOUNDER`**: Tenant Super-Admin (Full administrative & billing control).
- **`RECRUITER`**: Operational Recruiter (Pipeline management, candidate intake, client comms).
- **`CLIENT_HR`**: Client Representative (Candidate review, interview slotting, offer validation via magic link).
- **`PARTNER_RECRUITER`**: External Co-Broker (Access restricted to shared mandates).
- **`FINANCE_ADMIN`**: Billing Administrator (Invoice generation, split fee payouts, financial audits).

---

## 2. Granular Role-Permissions Matrix

### Legend
- **FULL**: Full Create, Read, Update, Delete permissions.
- **OWNED**: CRUD permitted only on records owned by or assigned to the user.
- **READ**: Read-only access.
- **LINK**: Access restricted via Magic Link / Access Token.
- **NONE**: Access denied.

| Domain & Entity | `AGENCY_FOUNDER` | `RECRUITER` | `CLIENT_HR` | `PARTNER_RECRUITER` | `FINANCE_ADMIN` |
|---|---|---|---|---|---|
| **Domain 1: Agency & Users** | | | | | |
| `agencies` | FULL | READ | NONE | NONE | READ |
| `users` | FULL | READ | NONE | NONE | READ |
| `user_roles` | FULL | NONE | NONE | NONE | NONE |
| `auth_sessions` | OWNED | OWNED | NONE | NONE | NONE |
| **Domain 2: Agency Config** | | | | | |
| `agency_branding` | FULL | READ | NONE | NONE | NONE |
| `agency_job_board_credentials` | FULL | NONE | NONE | NONE | NONE |
| **Domain 3: Candidate Repository** | | | | | |
| `candidate_records` | FULL | FULL | NONE | LINK | READ |
| `candidate_documents` | FULL | FULL | LINK | NONE | NONE |
| `candidate_relationships` | FULL | FULL | NONE | NONE | NONE |
| `candidate_ownership_logs` | FULL | READ | NONE | NONE | NONE |
| **Domain 4: Recruitment Pipeline** | | | | | |
| `clients` | FULL | READ | READ | NONE | READ |
| `client_contacts` | FULL | FULL | READ | NONE | NONE |
| `job_mandates` | FULL | FULL | LINK | LINK | READ |
| `job_prep_kits` | FULL | FULL | NONE | LINK | NONE |
| `candidate_submissions` | FULL | FULL | LINK | LINK | READ |
| `pipeline_sla_logs` | FULL | READ | NONE | NONE | NONE |
| **Domain 5: Communication & Magic Links** | | | | | |
| `communication_templates` | FULL | READ | NONE | NONE | NONE |
| `communication_logs` | FULL | OWNED | NONE | NONE | NONE |
| `client_portal_tokens` | FULL | FULL | LINK | NONE | NONE |
| **Domain 6: Client Feedback & Interviews** | | | | | |
| `proposed_interview_slots` | FULL | FULL | LINK | NONE | NONE |
| `interview_schedules` | FULL | FULL | LINK | NONE | NONE |
| `candidate_prep_logs` | FULL | READ | NONE | NONE | NONE |
| `candidate_interview_feedback` | FULL | FULL | LINK | NONE | NONE |
| **Domain 7: Compliance & Onboarding** | | | | | |
| `notice_period_trackers` | FULL | FULL | NONE | NONE | NONE |
| `notice_period_pulse_responses` | FULL | FULL | NONE | NONE | NONE |
| `candidate_compliance_docs` | FULL | FULL | LINK | NONE | READ |
| `job_offer_audits` | FULL | FULL | LINK | NONE | READ |
| `client_hr_handoffs` | FULL | FULL | LINK | NONE | NONE |
| `probation_guarantee_trackers` | FULL | FULL | NONE | NONE | READ |
| **Domain 8: Partner Collaboration** | | | | | |
| `partner_mandate_shares` | FULL | FULL | NONE | LINK | NONE |
| `partner_candidate_submissions` | FULL | READ | NONE | LINK | NONE |
| `candidate_ownership_arbitrations` | FULL | READ | NONE | LINK | NONE |
| `partner_split_ledgers` | FULL | READ | NONE | READ | FULL |
| **Domain 9: Finance & Billing** | | | | | |
| `invoice_records` | FULL | READ | NONE | NONE | FULL |
| `financial_vouchers` | FULL | NONE | NONE | NONE | FULL |
| `financial_audit_logs` | FULL | NONE | NONE | NONE | FULL |
| **Domain 10: Storefront & System Logs** | | | | | |
| `agency_storefront_profiles` | FULL | READ | NONE | NONE | NONE |
| `inbound_client_mandates` | FULL | READ | NONE | NONE | NONE |
| `system_activity_logs` | FULL | READ | NONE | NONE | READ |
| `notification_queues` | FULL | READ | NONE | NONE | NONE |

---

## 3. Key Feature-Level Permission Rules

1. **Candidate Deletion**: Restricted exclusively to `AGENCY_FOUNDER`. Soft-delete (`deleted_at`) is applied; physical hard-deletes are forbidden.
2. **Invoice Finalization & Cancellation**: Restricted to `AGENCY_FOUNDER` and `FINANCE_ADMIN`.
3. **Magic Link Token Access**: `CLIENT_HR` token access is scoped strictly to the `submission_id` or `job_id` bound to that token.
4. **Partner Submission Arbitration**: When a `PARTNER_RECRUITER` submits a candidate already present in `candidate_records`, an arbitration log is created in `candidate_ownership_arbitrations` for `AGENCY_FOUNDER` resolution.
