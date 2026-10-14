import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Use the Neon direct connection for Prisma migrations and schema checks.
  datasource: { url: env('DATABASE_URL') },
});
