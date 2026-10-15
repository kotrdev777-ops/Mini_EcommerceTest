import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Use Supabase's direct or session-pooler connection for migrations.
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
