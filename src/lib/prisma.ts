import { PrismaClient } from "@prisma/client";

/**
 * Create a new Prisma client instance.
 * 
 * For serverless environments like Vercel, we create a fresh instance
 * for each request to avoid "prepared statement already exists" errors.
 */
export function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// For development, use singleton to prevent connection exhaustion
// For production, create fresh instance each time
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = process.env.NODE_ENV === "production" 
  ? createPrismaClient() 
  : globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}