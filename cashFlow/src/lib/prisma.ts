import { PrismaClient } from "@prisma/client";

// Strip quotes from connection strings if they were copied with quotes from .env
if (process.env.POSTGRES_PRISMA_URL) {
  process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL.trim().replace(/^"|"$/g, '');
}
if (process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING.trim().replace(/^"|"$/g, '');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
