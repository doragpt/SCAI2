import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../jwt';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
      token?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log('認証処理を開始:', {
      path: req.path,
      method: req.method,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer ...' : undefined
      },
      timestamp: new Date().toISOString()
    });

    const token = extractTokenFromHeader(req.headers.authorization);
    console.log('トークンの抽出結果:', { 
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });

    if (!token) {
      console.log('トークンが見つかりません');
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }

    const payload = verifyToken(token);
    console.log('トークンの検証結果:', { 
      userId: payload.userId,
      timestamp: new Date().toISOString()
    });

    // ユーザーの存在確認
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      console.log('ユーザーが見つかりません:', {
        userId: payload.userId,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ message: 'Authentication failed: User not found' });
    }

    console.log('認証成功:', {
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('認証エラー:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('認可エラー: ユーザーが認証されていません');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRoles: roles,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    console.log('認可成功:', {
      userId: req.user.id,
      role: req.user.role,
      requiredRoles: roles,
      timestamp: new Date().toISOString()
    });

    next();
  };
}