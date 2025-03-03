import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRE = '24h';

export interface JwtPayload {
  userId: number;
  role: string;
}

export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function extractTokenFromHeader(header: string | undefined): string {
  if (!header) {
    throw new Error('No authorization header');
  }

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new Error('Invalid authorization header');
  }

  return token;
}
