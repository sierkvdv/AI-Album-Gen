import { PrismaClient } from "@prisma/client";

/**
 * Prisma client with proper serverless handling.
 * 
 * For Vercel serverless functions, we need to create a new instance
 * for each request to avoid "prepared statement already exists" errors.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}