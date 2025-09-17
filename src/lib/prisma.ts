import { PrismaClient } from "@prisma/client";

/**
 * Create a completely fresh Prisma client instance.
 * 
 * This function creates a brand new PrismaClient for each call,
 * which should prevent "prepared statement already exists" errors
 * in serverless environments like Vercel.
 */
export function createPrismaClient() {
  // Always create a completely new instance
  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Export a function that always creates a fresh client
export const prisma = createPrismaClient;