import { z } from 'zod';

export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dateOnly = z
  .string()
  .regex(DATE_ONLY, { message: 'debe ser una fecha con formato YYYY-MM-DD' })
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), { message: 'no es una fecha válida' });

const title = z
  .string({ required_error: 'el título es obligatorio' })
  .trim()
  .min(1, { message: 'el título es obligatorio' })
  .max(120, { message: 'el título debe tener como máximo 120 caracteres' });

const description = z.string().max(500, { message: 'la descripción debe tener como máximo 500 caracteres' });

const status = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: `el estado debe ser uno de: ${TASK_STATUSES.join(', ')}` }),
});

const uuidRef = (field: string) => z.string().uuid({ message: `${field} no es un identificador válido` });

export const createTaskSchema = z.object({
  title,
  description: description.nullish(),
  dueDate: dateOnly.nullish(),
  categoryId: uuidRef('categoryId').nullish(),
  priorityId: uuidRef('priorityId').nullish(),
});

export const updateTaskSchema = z
  .object({
    title: title.optional(),
    description: description.nullable().optional(),
    status: status.optional(),
    dueDate: dateOnly.nullable().optional(),
    categoryId: uuidRef('categoryId').nullable().optional(),
    priorityId: uuidRef('priorityId').nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'debe enviarse al menos un campo' });

export const taskFilterSchema = z
  .object({
    status: status.optional(),
    start_date: dateOnly.optional(),
    end_date: dateOnly.optional(),
  })
  .superRefine((q, ctx) => {
    if ((q.start_date && !q.end_date) || (!q.start_date && q.end_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [q.start_date ? 'end_date' : 'start_date'],
        message: 'start_date y end_date deben enviarse juntos',
      });
    } else if (q.start_date && q.end_date && q.start_date > q.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_date'],
        message: 'start_date no puede ser posterior a end_date',
      });
    }
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
