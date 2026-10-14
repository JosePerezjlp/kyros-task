import { PrismaClient } from '@prisma/client';

// Single shared Prisma client for the whole repository layer
export const prisma = new PrismaClient();
