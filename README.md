# RecruitOS — Next-Generation Enterprise Recruitment SaaS

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.18-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Storage-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Pino Logging](https://img.shields.io/badge/Pino-Structured_Logging-555555?style=flat-square)](https://github.com/pinojs/pino)

**RecruitOS** is a multi-tenant recruitment operating system engineered for executive staffing agencies and enterprise talent acquisition teams. It unifies high-contrast executive dashboards, candidate pipeline management, interview scheduling, automated offer & CTC calculations, candidate compliance verification, partner co-broker revenue split tracking, and automated placement invoicing into a high-performance web interface.

---

## 🌟 Key Platform Modules

1. **Recruiter Cockpit (`/cockpit`)**
   - Live KPI executive summaries (Active Requisitions, Candidate Pipeline, Placement Value, Interview Throughput).
   - Real-time SLA tracking, recruiter mandate assignments, and candidate pipeline distribution.

2. **Candidate Repository (`/candidates`)**
   - Talent database with full-text multi-attribute search (name, skills, company, designation).
   - Direct integration with candidate profile audit trails, resume storage, and status progression.

3. **Job Requisitions (`/jobs`)**
   - End-to-end mandate lifecycle management (Open, On Hold, Filled, Cancelled).
   - Client SLA mapping, target CTC ranges, fee structures, and assigned recruiters.

4. **Submissions & Pipeline (`/submissions`)**
   - Stage-by-stage candidate submission pipeline (Submitted, Client Screening, Shortlisted, Interviewing, Offered, Joined, Rejected).
   - Multi-tenant tenant boundary checks and recruiter attribution.

5. **Interview Management System (`/interviews`)**
   - Multi-stage interview scheduling (Screening, Technical, Leadership, HR).
   - Intersecting feedback collection, scorecard evaluations, and status automation.

6. **Offer Management System (`/offers`)**
   - CTC structure tracking (Fixed CTC, Variable CTC, Joining Bonus, ESOPs).
   - Notice period buyout calculations, offer acceptance tracking, and automatic invoice triggering.

7. **Compliance & Verification Center (`/compliance`)**
   - Document inventory (Aadhaar, PAN, Passport, Resumes, Salary Slips, BGV Reports).
   - Expiry alert engine, multi-tenant cloud storage via Supabase Storage buckets, and joining verification checks.

8. **Finance & Placement Invoicing (`/finance`)**
   - Automated placement invoice generation upon candidate joining.
   - Real-time revenue ledgers, outstanding receivables tracking, automated overdue status engine, and collection metrics.

9. **Partner Co-Broker Network (`/partners`)**
   - Agency directory, mandate co-sourcing sharing, and revenue split tracking (50/50, 60/40, custom splits).
   - Partner candidate submissions and payout ledger tracking.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌─────────────────────────┐
                               │   Next.js 14 App Router │
                               │  Server Actions & React │
                               └────────────┬────────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           ▼                                ▼                                ▼
┌────────────────────┐            ┌───────────────────┐            ┌────────────────────┐
│ High-Contrast UI   │            │ Multi-Tenant ORM  │            │ Zod Env Validation │
│ Tailwind CSS       │            │ Prisma ORM        │            │ & Structured Logger│
│ Lucide Icons       │            │ PostgreSQL (RLS)  │            │ Pino Logging Engine│
└────────────────────┘            └─────────┬─────────┘            └────────────────────┘
                                            │
                               ┌────────────┴────────────┐
                               │ Supabase Cloud Platform │
                               │ DB & Cloud File Storage │
                               └─────────────────────────┘
```

- **Framework**: Next.js 14 (App Router, Server Components & Server Actions)
- **Language**: TypeScript 5.0 (Strict mode enabled)
- **Styling**: Tailwind CSS + Custom High-Contrast Executive Theme (`globals.css`)
- **Database**: PostgreSQL (Supabase) accessed via Prisma ORM
- **Security**: Multi-tenant isolation (`agencyId` scoping) & Zod startup environment validation (`src/env.ts`)
- **File Storage**: Supabase Cloud Storage (Tenant-isolated `resumes`, `compliance-docs`, `offer-documents` buckets)
- **Observability**: Pino Structured Logging Infrastructure (`src/lib/logger.ts`)

---

## 📁 Repository Structure

```
RecruitOS/
├── docs/                             # Platform Documentation & Specifications
│   ├── architecture/                 # System design, DB schema specs, and security blueprints
│   ├── audits/                       # Health reports, test coverage, and schema validation
│   ├── deployment/                   # Go-live checklists, env guides, and setup runbooks
│   └── phases/                       # Modernization & phase implementation summaries
├── prisma/                           # Database Schema & Migrations
│   ├── schema.prisma                 # Primary Prisma schema definition
│   └── migrations/                   # Migration history
├── public/                           # Static assets
├── src/                              # Application Source Code
│   ├── app/                          # Next.js App Router routes & layouts
│   │   ├── (dashboard)/              # Core enterprise module pages
│   │   ├── api/                      # REST & API endpoints
│   │   └── globals.css               # Design system tokens & utility classes
│   ├── components/                   # Modular React UI components
│   ├── env.ts                        # Zod environment validation layer
│   └── lib/                          # Shared libraries (Prisma client, Pino logger, storage)
├── tests/                            # Test Suites & Verification Scripts
│   ├── integration/                  # End-to-end integration tests
│   ├── runtime/                      # Domain-specific runtime verification scripts
│   └── utilities/                    # Database inspection & schema maintenance scripts
├── .env.example                      # Template environment variable configurations
├── .gitignore                        # Git exclusion rules
├── package.json                      # Dependencies & scripts
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.17.0 or later
- **npm**: v9.0.0 or later
- **PostgreSQL**: PostgreSQL 14+ database instance (or Supabase URL)

### 2. Installation & Configuration

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Botspringllp/Recruit_OS.git
   cd Recruit_OS
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and populate required keys:
   ```bash
   cp .env.example .env.local
   ```
   *Required variables*:
   - `DATABASE_URL`: PostgreSQL connection string (pooled)
   - `DIRECT_URL`: PostgreSQL direct connection string (unpooled)
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project API URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase secret service role key

4. **Initialize Prisma Schema & Database**:
   ```bash
   npx prisma db push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access application at `http://localhost:3000`.

---

## 🧪 Verification & Build Commands

- **Type Check**:
  ```bash
  npx tsc --noEmit
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Run Integration Verification**:
  ```bash
  node tests/integration/verify_full_platform_integration.js
  ```

---

## 🔒 Security & Multi-Tenancy

RecruitOS enforces strict multi-tenant isolation across all data access layers:
1. Every query in Server Actions and page routes includes an explicit `agencyId` filter.
2. Cloud File Storage paths are prefixed by tenant agency identifiers (`{agencyId}/{category}/{fileName}`).
3. Environment variables are validated at startup via `src/env.ts` using Zod schema verification.

---

## 📜 License & Ownership

Developed for **RecruitOS Enterprise Platform** — All rights reserved.
Repository: [Botspringllp/Recruit_OS](https://github.com/Botspringllp/Recruit_OS.git)
