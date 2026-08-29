import { z } from 'zod';

// Validate environment variables on Next.js startup
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional()
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.warn('⚠️ [Environment Warning]: Missing non-fatal env variables');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.recruitos.com', '*.vercel.app'],
    },
  },
};

export default nextConfig;
