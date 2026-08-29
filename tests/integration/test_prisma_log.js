const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  console.log('Creating partner tables via PgBouncer pooled connection...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.partner_agencies (
      partner_id UUID NOT NULL DEFAULT gen_random_uuid(),
      agency_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(64),
      default_split_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00,
      is_active BOOLEAN NOT NULL DEFAULT true,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT partner_agencies_pkey PRIMARY KEY (partner_id)
    )
  `);
  console.log('✅ Created table public.partner_agencies');

  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_candidate_submissions DROP CONSTRAINT IF EXISTS partner_candidate_submissions_share_id_fkey`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_candidate_submissions DROP CONSTRAINT IF EXISTS partner_candidate_submissions_candidate_id_fkey`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers DROP CONSTRAINT IF EXISTS partner_split_ledgers_submission_id_fkey`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers DROP CONSTRAINT IF EXISTS partner_split_ledgers_partner_agency_id_fkey`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ALTER COLUMN origin_agency_id DROP NOT NULL`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS agency_id UUID`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS partner_agency_id UUID`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS mandate_id UUID`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS partner_agency_name VARCHAR(255)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS partner_access_token VARCHAR(128)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS split_percentage DECIMAL(5,2) DEFAULT 50.00`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS notes TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'ACTIVE'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_mandate_shares ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`);
  console.log('✅ Altered public.partner_mandate_shares');

  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_candidate_submissions ALTER COLUMN partner_agency_id DROP NOT NULL`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_candidate_submissions ADD COLUMN IF NOT EXISTS partner_submission_id UUID DEFAULT gen_random_uuid()`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_candidate_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_candidate_submissions ALTER COLUMN submitted_at SET DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
  console.log('✅ Altered public.partner_candidate_submissions with partner_submission_id & submitted_at');

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SettlementStatus') THEN
        CREATE TYPE "SettlementStatus" AS ENUM ('UNBILLED', 'INVOICED', 'PARTIALLY_SETTLED', 'SETTLED', 'DISPUTED', 'CANCELLED');
      END IF;
    END $$;
  `).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ALTER COLUMN settlement_status TYPE "SettlementStatus" USING settlement_status::"SettlementStatus"`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ALTER COLUMN payout_status TYPE VARCHAR(32) USING payout_status::VARCHAR`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ALTER COLUMN total_fee_amount DROP NOT NULL`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ALTER COLUMN partner_share_amount DROP NOT NULL`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ALTER COLUMN host_agency_id DROP NOT NULL`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ALTER COLUMN partner_agency_id DROP NOT NULL`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS ledger_id UUID DEFAULT gen_random_uuid()`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS agency_id UUID`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS total_placement_fee DECIMAL(10,2) DEFAULT 0`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS host_agency_share DECIMAL(10,2) DEFAULT 0`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS partner_agency_share DECIMAL(10,2) DEFAULT 0`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.partner_split_ledgers ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(32) DEFAULT 'UNBILLED'`);
  console.log('✅ Altered public.partner_split_ledgers with fee columns');
}

main().catch(err => console.error('ERR:', err)).finally(() => prisma.$disconnect());
