import { z } from 'zod';

export const masterDataSchema = z.object({
  name: z
    .string({ required_error: 'el nombre es obligatorio' })
    .trim()
    .min(1, { message: 'el nombre no puede estar vacío' })
    .max(100, { message: 'el nombre debe tener como máximo 100 caracteres' }),
});

export type MasterDataInput = z.infer<typeof masterDataSchema>;
