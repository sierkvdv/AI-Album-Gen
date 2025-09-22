import { PrismaClient } from "@prisma/client";

<<<<<<< HEAD
// Global variable to store the Prisma client. In development we reuse a
// single instance to avoid exhausting the database connection pool. In
// production (serverless) we create a new client per request.
declare global {
  // eslint-disable-next-line no-var
=======
// Global variable to store the Prisma client
declare global {
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
  var __prisma: PrismaClient | undefined;
}

/**
<<<<<<< HEAD
 * Create or reuse a Prisma client instance.
 *
 * The Next.js server runtime is often stateless; however during local
 * development the module cache is preserved across hot reloads. This helper
 * ensures that we reuse the Prisma client in development while creating a
 * fresh client in production.
 */
export function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  // Append pgbouncer parameters to ensure prepared statements are disabled in
  // serverless environments. Without this Supabase's pgbouncer will reject
  // the connection.
  const modifiedUrl = databaseUrl?.includes('?')
    ? `${databaseUrl}&pgbouncer=true&connection_limit=1`
    : `${databaseUrl}?pgbouncer=true&connection_limit=1`;

  // Always create a new client in production/serverless mode
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error'],
      datasources: { db: { url: modifiedUrl } },
    });
  }

  // Reuse client in development to avoid multiple connections
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error'],
      datasources: { db: { url: modifiedUrl } },
    });
  }
  return global.__prisma;
}

// Export a convenient getter which creates or returns the client
=======
 * Create or reuse Prisma client instance.
 * 
 * In development, we reuse the same instance to avoid connection limits.
 * In production (serverless), we create fresh instances for each request.
 */
export function createPrismaClient() {
  // Modify DATABASE_URL to disable prepared statements for serverless
  const databaseUrl = process.env.DATABASE_URL;
  const modifiedUrl = databaseUrl?.includes('?') 
    ? `${databaseUrl}&pgbouncer=true&connection_limit=1`
    : `${databaseUrl}?pgbouncer=true&connection_limit=1`;

  // In production (serverless), always create a new instance
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: modifiedUrl,
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
          url: modifiedUrl,
        },
      },
    });
  }

  return global.__prisma;
}

// Export a function that creates or gets a client
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
export const prisma = createPrismaClient;