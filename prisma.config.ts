import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Prisma migrations require a session-capable, non-pooling connection.
  // Prefer Vercel's non-pooling Postgres URL, then the explicitly configured
  // direct URL. DATABASE_URL is kept as a final fallback for local setups.
  datasource: {
    url:
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      '',
  },
});
