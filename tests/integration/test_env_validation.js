const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// Load .env.local manually
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const envSchema = z.object({
  DATABASE_URL: z
    .string({ message: 'DATABASE_URL is required for database connection pooling' })
    .min(1, 'DATABASE_URL cannot be empty'),
  DIRECT_URL: z
    .string({ message: 'DIRECT_URL is required for direct database administration/migrations' })
    .min(1, 'DIRECT_URL cannot be empty'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ message: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL cannot be empty')
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL string'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ message: 'SUPABASE_SERVICE_ROLE_KEY is required for server admin operations' })
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty'),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  ❌ [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    const banner = `
=================================================================
❌ CRITICAL ENVIRONMENT VALIDATION ERROR — RECRUITOS STARTUP ABORTED
=================================================================
The application failed to initialize because one or more required
environment variables are missing or invalid:

${formattedErrors}

Please ensure all mandatory variables are defined in '.env.local'
or system environment before starting RecruitOS.
=================================================================
`;

    console.error(banner);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
    throw new Error(banner);
  }
  return result.data;
}

console.log('=================================================================');
console.log('🧪 RUNNING PHASE PR-01A ENVIRONMENT VALIDATION LAYER TEST SUITE');
console.log('=================================================================\n');

// Test 1: Valid environment configuration
try {
  console.log('--- TEST 1: Valid Environment Pass ---');
  const validEnv = validateEnv();
  console.log('✅ DATABASE_URL:', validEnv.DATABASE_URL.substring(0, 35) + '...');
  console.log('✅ DIRECT_URL:', validEnv.DIRECT_URL.substring(0, 35) + '...');
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', validEnv.NEXT_PUBLIC_SUPABASE_URL);
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY Present:', !!validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY Present:', !!validEnv.SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Validation Test 1 Passed Successfully!\n');
} catch (err) {
  console.error('❌ Test 1 Failed unexpectedly:', err.message);
  process.exit(1);
}

// Test 2: Missing Required Variable (Failure Mode Simulation)
console.log('--- TEST 2: Missing Variable Failure Abort Simulation ---');
const originalDbUrl = process.env.DATABASE_URL;
const originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

delete process.env.DATABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

let caughtError = false;
try {
  const originalExit = process.exit;
  process.exit = (code) => {
    throw new Error(`process.exit called with code ${code}`);
  };

  validateEnv();

  process.exit = originalExit;
} catch (err) {
  caughtError = true;
  console.log('✅ Caught expected startup failure for missing required variables!');
}

process.env.DATABASE_URL = originalDbUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey;

if (!caughtError) {
  console.error('❌ Test 2 Failed: Application did not block startup when required env vars were missing!');
  process.exit(1);
} else {
  console.log('✅ Validation Test 2 Passed: Startup correctly aborted on missing required variables!\n');
}

console.log('=================================================================');
console.log('🎉 PHASE PR-01A ENVIRONMENT VALIDATION ALL SUITES PASSED (100%)');
console.log('=================================================================');
