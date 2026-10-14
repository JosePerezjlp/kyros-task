import { TaskStatus } from '@prisma/client';
import { prisma } from './prisma';

export async function getStatusCounts(userId: string): Promise<Record<TaskStatus, number>> {
  const groups = await prisma.task.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
  });

  const counts: Record<TaskStatus, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const group of groups) {
    counts[group.status] = group._count._all;
  }
  return counts;
}

export async function getOverdueCount(userId: string, todayStart: Date): Promise<number> {
  return prisma.task.count({
    where: { userId, status: { not: 'done' }, dueDate: { lt: todayStart } },
  });
}

export async function getUpcomingTasks(
  userId: string,
  from: Date,
  to: Date,
): Promise<Array<{ id: string; title: string; dueDate: Date | null }>> {
  return prisma.task.findMany({
    where: { userId, status: { not: 'done' }, dueDate: { gte: from, lt: to } },
    select: { id: true, title: true, dueDate: true },
    orderBy: { dueDate: 'asc' },
  });
}
