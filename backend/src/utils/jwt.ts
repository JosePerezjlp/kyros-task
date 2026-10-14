import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  role: 'USER' | 'ADMIN';
}

export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as JwtPayload;
}
