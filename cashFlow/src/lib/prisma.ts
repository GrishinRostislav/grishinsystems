import { PrismaClient } from "@prisma/client";

const cleanUrl = (url: string): string => {
  let cleaned = url.trim().replace(/^"|"$/g, '');
  
  // If the value includes an equals sign (e.g. "POSTGRES_PRISMA_URL=postgresql://..."),
  // strip the variable name prefix before the equals sign.
  const equalIdx = cleaned.indexOf('=');
  if (equalIdx !== -1 && equalIdx < 50) { 
    cleaned = cleaned.substring(equalIdx + 1);
  }
  
  return cleaned.trim().replace(/^"|"$/g, '');
};

// Clean connection strings dynamically
if (process.env.POSTGRES_PRISMA_URL) {
  process.env.POSTGRES_PRISMA_URL = cleanUrl(process.env.POSTGRES_PRISMA_URL);
}
if (process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL_NON_POOLING = cleanUrl(process.env.POSTGRES_URL_NON_POOLING);
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
