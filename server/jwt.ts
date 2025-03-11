import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRE = '24h';

export interface JwtPayload {
  userId: number;
  role: string;
}

export function generateToken(user: User): string {
  try {
    if (!user.id || !user.role) {
      throw new Error('無効なユーザー情報です');
    }

    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new Error('トークンの生成に失敗しました');
  }
}

export function verifyToken(token: string): JwtPayload {
  try {
    if (!token) {
      throw new Error('トークンが提供されていません');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

export function extractTokenFromHeader(authHeader: string): string {
  if (!authHeader) {
    throw new Error('認証ヘッダーがありません');
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new Error('無効な認証ヘッダーです');
  }

  return token;
}