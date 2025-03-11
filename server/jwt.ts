import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

// JWT設定
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

    console.log('Generating JWT token:', {
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
  } catch (error) {
    console.error('Token generation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    throw new Error('トークンの生成に失敗しました');
  }
}

export function verifyToken(token: string): JwtPayload {
  try {
    if (!token || typeof token !== 'string' || !token.trim()) {
      throw new Error('トークンが無効です');
    }

    console.log('Verifying JWT token:', {
      tokenPreview: token.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || typeof decoded !== 'object' || !decoded.userId || !decoded.role) {
      throw new Error('トークンの形式が不正です');
    }

    if (typeof decoded.userId !== 'number' || typeof decoded.role !== 'string') {
      throw new Error('トークンのペイロード形式が不正です');
    }

    console.log('Token verification successful:', {
      userId: decoded.userId,
      role: decoded.role,
      timestamp: new Date().toISOString()
    });

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export function extractTokenFromHeader(header: string | undefined): string {
  if (!header) {
    throw new Error('認証ヘッダーがありません');
  }

  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token || !token.trim()) {
    console.error('Invalid authorization header:', {
      type,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });
    throw new Error('認証ヘッダーの形式が不正です');
  }

  return token.trim();
}