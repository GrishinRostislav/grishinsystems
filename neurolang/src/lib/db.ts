import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parse } from "pg-connection-string";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
  const connectionString = process.env.DATABASE_URL;
  let pool: Pool;
  if (connectionString) {
    const config = parse(connectionString) as any;
    config.ssl = { rejectUnauthorized: false };
    pool = new Pool(config);
  } else {
    pool = new Pool();
  }
  const adapter = new PrismaPg(pool);
  
  prismaInstance = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
} else {
  // Fallback for edge cases where Node PG Pool cannot be imported
  prismaInstance = new PrismaClient();
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
