import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 *
 * Next.js hot reloads modules on file changes, which can result in multiple
 * instances of PrismaClient being created in development.  To avoid
 * exhausting database connections, we store the client on the global
 * namespace.  In production (single instance) we simply instantiate a new
 * client.
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}