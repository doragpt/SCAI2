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
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
    };
    console.log('Generating token for user:', {
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString()
    });
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
  } catch (error) {
    console.error('Token generation error:', {
      error,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    throw new Error('トークンの生成に失敗しました');
  }
}

export function verifyToken(token: string): JwtPayload {
  try {
    console.log('Verifying token:', {
      tokenPreview: token.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('Token verified:', {
      userId: decoded.userId,
      role: decoded.role,
      timestamp: new Date().toISOString()
    });
    return decoded;
  } catch (error) {
    console.error('Token verification error:', {
      error,
      timestamp: new Date().toISOString()
    });
    throw new Error('トークンが無効です');
  }
}

export function extractTokenFromHeader(header: string | undefined): string {
  if (!header) {
    console.error('No authorization header');
    throw new Error('認証ヘッダーがありません');
  }

  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    console.error('Invalid authorization header format:', {
      type,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });
    throw new Error('認証ヘッダーの形式が不正です');
  }

  return token;
}