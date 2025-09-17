import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client for serverless environments.
 * 
 * This ensures we don't create multiple connections in serverless deployments
 * like Vercel, which can cause "prepared statement already exists" errors.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create a new PrismaClient instance
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Use global variable in development to prevent hot reload issues
// In production, always create a new instance for serverless
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}