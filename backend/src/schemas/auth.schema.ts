import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'el email es obligatorio' })
    .email({ message: 'el email no es válido' }),
  password: z
    .string({ required_error: 'la contraseña es obligatoria' })
    .min(8, { message: 'la contraseña debe tener al menos 8 caracteres' }),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'el email es obligatorio' }).min(1, { message: 'el email es obligatorio' }),
  password: z
    .string({ required_error: 'la contraseña es obligatoria' })
    .min(1, { message: 'la contraseña es obligatoria' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
