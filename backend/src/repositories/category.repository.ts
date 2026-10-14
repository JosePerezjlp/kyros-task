import { Category } from '@prisma/client';
import { prisma } from './prisma';

export async function findAllCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function findCategoryById(id: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { id } });
}

/** Case-insensitive lookup by name, optionally excluding one record (used on update). */
export async function findCategoryByName(name: string, excludeId?: string): Promise<Category | null> {
  return prisma.category.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export async function createCategory(name: string): Promise<Category> {
  return prisma.category.create({ data: { name } });
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  return prisma.category.update({ where: { id }, data: { name } });
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
}

export async function countTasksUsingCategory(id: string): Promise<number> {
  return prisma.task.count({ where: { categoryId: id } });
}
