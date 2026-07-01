// Prisma client singleton — the real PostgreSQL data layer.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG ? ['query', 'warn', 'error'] : ['warn', 'error'],
});
