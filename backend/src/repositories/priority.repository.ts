import { Priority } from '@prisma/client';
import { prisma } from './prisma';

export async function findAllPriorities(): Promise<Priority[]> {
  return prisma.priority.findMany({ orderBy: { name: 'asc' } });
}

export async function findPriorityById(id: string): Promise<Priority | null> {
  return prisma.priority.findUnique({ where: { id } });
}

/** Case-insensitive lookup by name, optionally excluding one record (used on update). */
export async function findPriorityByName(name: string, excludeId?: string): Promise<Priority | null> {
  return prisma.priority.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export async function createPriority(name: string): Promise<Priority> {
  return prisma.priority.create({ data: { name } });
}

export async function updatePriority(id: string, name: string): Promise<Priority> {
  return prisma.priority.update({ where: { id }, data: { name } });
}

export async function deletePriority(id: string): Promise<void> {
  await prisma.priority.delete({ where: { id } });
}

export async function countTasksUsingPriority(id: string): Promise<number> {
  return prisma.task.count({ where: { priorityId: id } });
}
