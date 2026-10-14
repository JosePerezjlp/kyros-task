import { Role, User } from '@prisma/client';
import { prisma } from './prisma';

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  email: string;
  password: string;
  role: Role;
}): Promise<User> {
  return prisma.user.create({ data });
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}
