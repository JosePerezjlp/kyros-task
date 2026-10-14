import { findUserByEmail, createUser, countUsers } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export interface AuthResult {
  token: string;
  user: { id: string; email: string; role: 'USER' | 'ADMIN' };
}

function buildAuthResult(user: { id: string; email: string; role: 'USER' | 'ADMIN' }): AuthResult {
  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  // Check for duplicate email
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, 'El email ya está registrado');
  }

  // First user becomes ADMIN
  const userCount = await countUsers();
  const role = userCount === 0 ? 'ADMIN' : 'USER';

  // Hash password (cost >= 10)
  const hashedPassword = await hashPassword(input.password);

  // Create user
  const user = await createUser({
    email: input.email,
    password: hashedPassword,
    role,
  });

  return buildAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  // Generic error message — never reveal which field was wrong
  const GENERIC_ERROR = 'Credenciales inválidas';

  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError(401, GENERIC_ERROR);
  }

  const passwordMatch = await comparePassword(input.password, user.password);
  if (!passwordMatch) {
    throw new AppError(401, GENERIC_ERROR);
  }

  return buildAuthResult(user);
}
