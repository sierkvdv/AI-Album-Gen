import { PrismaClient } from "@prisma/client";

// Global variable to store the Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Create or reuse Prisma client instance.
 * 
 * In development, we reuse the same instance to avoid connection limits.
 * In production (serverless), we create fresh instances for each request.
 */
export function createPrismaClient() {
  // In production (serverless), always create a new instance
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  // In development, reuse the global instance
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  return global.__prisma;
}

// Export a function that creates or gets a client
export const prisma = createPrismaClient;