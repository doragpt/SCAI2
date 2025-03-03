import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRETが設定されていません');
}

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
    console.log('トークンの検証を開始:', { token: token.substring(0, 10) + '...' });
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('トークンの検証成功:', { userId: payload.userId, role: payload.role });
    return payload;
  } catch (error) {
    console.error('トークンの検証に失敗:', error);
    throw new Error('トークンが無効です');
  }
}

export function extractTokenFromHeader(header: string | undefined): string {
  if (!header) {
    console.error('認証ヘッダーがありません');
    throw new Error('認証ヘッダーがありません');
  }

  const [type, token] = header.split(' ');

  console.log('トークンの抽出:', {
    headerType: type,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 10) + '...' : 'なし'
  });

  if (type !== 'Bearer' || !token) {
    console.error('認証ヘッダーの形式が不正です:', { type, hasToken: !!token });
    throw new Error('認証ヘッダーの形式が不正です');
  }

  return token;
}