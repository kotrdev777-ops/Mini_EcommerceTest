import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma';
import { Pool } from 'pg';

const globalDb = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };

export function db() {
  if (!globalDb.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');
    globalDb.pool = new Pool({ connectionString, max: 5 });
    globalDb.prisma = new PrismaClient({ adapter: new PrismaPg(globalDb.pool) });
  }
  return globalDb.prisma;
}
