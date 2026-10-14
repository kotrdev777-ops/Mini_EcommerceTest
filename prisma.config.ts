import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Neon provides a direct URL for schema changes and a pooled URL for app traffic.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || env('DATABASE_URL') },
});
