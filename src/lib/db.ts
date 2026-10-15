import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma';
import { Pool } from 'pg';

const globalDb = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };

export function db() {
  if (!globalDb.prisma) {
    const connectionString =
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL ??
      process.env.DATABASE_URL;
    if (!connectionString) throw new Error('A Postgres connection string is required');
    const databaseUrl = new URL(connectionString);
    databaseUrl.searchParams.delete('sslmode');
    globalDb.pool = new Pool({
      connectionString: databaseUrl.toString(),
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
    globalDb.prisma = new PrismaClient({ adapter: new PrismaPg(globalDb.pool) });
  }
  return globalDb.prisma;
}
