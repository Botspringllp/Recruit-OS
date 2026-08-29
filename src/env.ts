import { z } from 'zod';

/**
 * RecruitOS Environment Variable Schema
 * Enforces server-side validation for database connections, Supabase keys, and credentials.
 * Supports both NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY aliases.
 */

const envSchema = z.object({
  // Core PostgreSQL Database Connections (Server-Only)
  DATABASE_URL: z
    .string({ message: 'DATABASE_URL is required for database connection pooling' })
    .min(1, 'DATABASE_URL cannot be empty'),
  DIRECT_URL: z
    .string({ message: 'DIRECT_URL is required for direct database administration/migrations' })
    .min(1, 'DIRECT_URL cannot be empty'),

  // Supabase Auth & API Gateway Keys
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ message: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL cannot be empty'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is required' })
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
  const isServer = typeof window === 'undefined';

  // Client-Side Browser Environment Execution
  if (!isServer) {
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      '';

    return {
      DATABASE_URL: '',
      DIRECT_URL: '',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: '',
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
  }

  // Server-Side Node.js / Server Component Execution
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const envData = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  };

  const result = envSchema.safeParse(envData);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  ❌ [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    console.warn(`
=================================================================
⚠️ ENVIRONMENT VALIDATION WARNING — RECRUITOS DEPLOYMENT
=================================================================
Uninitialized environment variables detected:

${formattedErrors}

Please ensure variables are configured in Vercel project settings.
=================================================================
`);

    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      DIRECT_URL: process.env.DIRECT_URL || '',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey || 'demo-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
  }

  return result.data;
}

export const env = validateEnv();
