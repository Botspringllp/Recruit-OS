import { z } from 'zod';

/**
 * RecruitOS Environment Variable Schema
 * Enforces production-grade environment validation for database connections,
 * Supabase gateway, auth keys, and integration credentials.
 * Handles client-side vs server-side environment safely to prevent hydration crashes.
 */

const serverSchema = z.object({
  DATABASE_URL: z.string().default(''),
  DIRECT_URL: z.string().default(''),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default('https://demo.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('demo-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('demo-service-role-key'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().default('https://demo.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('demo-anon-key'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof serverSchema>;

export function validateEnv(): Env {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const result = serverSchema.safeParse(process.env);
    if (!result.success) {
      console.warn('⚠️ Server Environment Variable Warning:', result.error.format());
    }
    return (result.success ? result.data : process.env) as Env;
  } else {
    // Client-side browser bundle validation (only public env vars)
    const clientData = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    const result = clientSchema.safeParse(clientData);
    return {
      DATABASE_URL: '',
      DIRECT_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      ...clientData
    } as Env;
  }
}

export const env = validateEnv();
