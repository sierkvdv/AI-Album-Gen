import { PrismaClient } from '@prisma/client';

/**
 * The Prisma client should be instantiated once per process. When using Next.js
 * in development, the hot-reloading mechanism can cause new PrismaClient
 * instances to be created on every reload which leads to exhausting the
 * connection pool. This helper uses the global namespace to cache the
 * instance across reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}