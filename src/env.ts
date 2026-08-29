import { z } from 'zod';

/**
 * RecruitOS Environment Variable Schema
 * Enforces production-grade environment validation for database connections,
 * Supabase gateway, auth keys, and integration credentials.
 */

const envSchema = z.object({
  // Core PostgreSQL Database Connections
  DATABASE_URL: z
    .string({ message: 'DATABASE_URL is required for database connection pooling' })
    .min(1, 'DATABASE_URL cannot be empty'),
  DIRECT_URL: z
    .string({ message: 'DIRECT_URL is required for direct database administration/migrations' })
    .min(1, 'DIRECT_URL cannot be empty'),

  // Supabase Auth & API Gateway Keys
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

  // Runtime Environment & Base URL
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),

  // Optional Services & Credentials
  JWT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    const banner = `
=================================================================
CRITICAL: ENVIRONMENT VALIDATION ERROR — RECRUITOS STARTUP ABORTED
=================================================================
Missing or invalid environment variables:

${formattedErrors}

Please ensure all mandatory variables are defined in '.env.local'
or the Vercel Environment Variables dashboard before deploying.
=================================================================
`;

    console.error(banner);

    // NOTE: Do NOT call process.exit(1) here — it crashes the Edge Runtime (Vercel middleware).
    // Instead, throw an error that Next.js can handle gracefully.
    throw new Error(banner);
  }

  return result.data;
}

export const env = validateEnv();
