import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Vercel builds need Supabase's pooler endpoint (DATABASE_URL).
  // DIRECT_URL points at the IPv6-only database host and is not reachable
  // from every Vercel build environment.
  datasource: {
    url: process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? '',
  },
});
