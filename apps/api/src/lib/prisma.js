import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// (Optional) log queries in dev:
// export const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });
