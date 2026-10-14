import {
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  findTaskById,
  findTaskWithRelationsById,
  findTasksByUser,
  updateTask as updateTaskRecord,
  TaskWithRelations,
  TaskWriteData,
} from '../repositories/task.repository';
import { findCategoryById } from '../repositories/category.repository';
import { findPriorityById } from '../repositories/priority.repository';
import { AppError } from '../utils/AppError';
import { addDays, parseDateOnly } from '../utils/date';
import { CreateTaskInput, TaskFilterInput, UpdateTaskInput } from '../schemas/task.schema';

async function assertReferencesExist(categoryId?: string | null, priorityId?: string | null): Promise<void> {
  if (categoryId && !(await findCategoryById(categoryId))) {
    throw new AppError(400, 'La categoría seleccionada no existe');
  }
  if (priorityId && !(await findPriorityById(priorityId))) {
    throw new AppError(400, 'La prioridad seleccionada no existe');
  }
}

/** Loads a task and enforces that it belongs to the given user. */
async function getOwnedTask(taskId: string, userId: string) {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new AppError(404, 'Tarea no encontrada');
  }
  if (task.userId !== userId) {
    throw new AppError(403, 'No tienes acceso a esta tarea');
  }
  return task;
}

function toWriteData(input: CreateTaskInput | UpdateTaskInput): TaskWriteData {
  const data: TaskWriteData = {};
  if ('title' in input && input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if ('status' in input && input.status !== undefined) data.status = input.status;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate === null ? null : parseDateOnly(input.dueDate);
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.priorityId !== undefined) data.priorityId = input.priorityId;
  return data;
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskWithRelations> {
  await assertReferencesExist(input.categoryId, input.priorityId);
  // New tasks always start as pending (database default)
  return createTaskRecord(userId, { ...toWriteData(input), title: input.title });
}

export async function listTasks(userId: string, filters: TaskFilterInput): Promise<TaskWithRelations[]> {
  return findTasksByUser(userId, {
    status: filters.status,
    dueFrom: filters.start_date ? parseDateOnly(filters.start_date) : undefined,
    dueTo: filters.end_date ? addDays(parseDateOnly(filters.end_date), 1) : undefined,
  });
}

export async function getTask(userId: string, taskId: string): Promise<TaskWithRelations> {
  await getOwnedTask(taskId, userId);
  return (await findTaskWithRelationsById(taskId)) as TaskWithRelations;
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskWithRelations> {
  await getOwnedTask(taskId, userId);
  await assertReferencesExist(input.categoryId, input.priorityId);
  // Only the provided fields are written; the owner is never changed
  return updateTaskRecord(taskId, toWriteData(input));
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await getOwnedTask(taskId, userId);
  await deleteTaskRecord(taskId);
}
