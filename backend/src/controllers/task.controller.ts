import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import { CreateTaskInput, TaskFilterInput, UpdateTaskInput } from '../schemas/task.schema';

export async function listTasksHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tasks = await taskService.listTasks(req.user!.sub, req.query as TaskFilterInput);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function createTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.createTask(req.user!.sub, req.body as CreateTaskInput);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function getTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.getTask(req.user!.sub, req.params.id);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.updateTask(req.user!.sub, req.params.id, req.body as UpdateTaskInput);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTaskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await taskService.deleteTask(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
