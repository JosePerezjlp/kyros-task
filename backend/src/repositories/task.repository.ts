import { Prisma, Task, TaskStatus } from '@prisma/client';
import { prisma } from './prisma';

// Category and priority names are returned with every task so the UI can show them
const taskInclude = {
  category: { select: { id: true, name: true } },
  priority: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export interface TaskFilters {
  status?: TaskStatus;
  /** Inclusive lower bound (start of day, UTC) */
  dueFrom?: Date;
  /** Exclusive upper bound (start of the day after end_date, UTC) */
  dueTo?: Date;
}

export interface TaskWriteData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: Date | null;
  categoryId?: string | null;
  priorityId?: string | null;
}

export async function createTask(userId: string, data: TaskWriteData & { title: string }): Promise<TaskWithRelations> {
  return prisma.task.create({ data: { ...data, userId }, include: taskInclude });
}

export async function findTaskById(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } });
}

export async function findTaskWithRelationsById(id: string): Promise<TaskWithRelations | null> {
  return prisma.task.findUnique({ where: { id }, include: taskInclude });
}

export async function findTasksByUser(userId: string, filters: TaskFilters): Promise<TaskWithRelations[]> {
  const where: Prisma.TaskWhereInput = { userId };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dueFrom && filters.dueTo) {
    where.dueDate = { gte: filters.dueFrom, lt: filters.dueTo };
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
}

export async function updateTask(id: string, data: TaskWriteData): Promise<TaskWithRelations> {
  return prisma.task.update({ where: { id }, data, include: taskInclude });
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.task.delete({ where: { id } });
}
