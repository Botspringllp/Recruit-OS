import { z } from 'zod';

// Validate environment variables on Next.js startup
const envSchema = z.object({
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required' }).min(1, 'DATABASE_URL cannot be empty'),
  DIRECT_URL: z.string({ message: 'DIRECT_URL is required' }).min(1, 'DIRECT_URL cannot be empty'),
  NEXT_PUBLIC_SUPABASE_URL: z.string({ message: 'NEXT_PUBLIC_SUPABASE_URL is required' }).min(1, 'NEXT_PUBLIC_SUPABASE_URL cannot be empty').url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({ message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }).min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
  SUPABASE_SERVICE_ROLE_KEY: z.string({ message: 'SUPABASE_SERVICE_ROLE_KEY is required' }).min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional()
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  const formattedErrors = result.error.issues
    .map((issue) => `  ❌ [${issue.path.join('.')}]: ${issue.message}`)
    .join('\n');

  console.error(`
=================================================================
❌ CRITICAL ENVIRONMENT VALIDATION ERROR — RECRUITOS STARTUP ABORTED
=================================================================
The application failed to initialize because one or more required
environment variables are missing or invalid:

${formattedErrors}

Please ensure all mandatory variables are defined in '.env.local'
or system environment before starting RecruitOS.
=================================================================
`);
  process.exit(1);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.recruitos.com'],
    },
  },
};

export default nextConfig;
