import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../jwt';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// ログ関数をインポート
import { log } from '../utils/logger';

// ユーザー型の拡張を修正
declare global {
  namespace Express {
    interface User {
      id: number;
      role: "talent" | "store";
      username: string;
    }
    interface Request {
      user?: User;
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
    log('info', '認証処理を開始', {
      path: req.path,
      method: req.method,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer ...' : undefined
      }
    });

    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      log('warn', 'トークンが見つかりません');
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }

    const payload = verifyToken(token);
    log('info', 'トークンの検証結果', { 
      userId: payload.userId
    });

    // ユーザーの存在確認
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      log('warn', 'ユーザーが見つかりません', {
        userId: payload.userId
      });
      return res.status(401).json({ message: 'Authentication failed: User not found' });
    }

    log('info', '認証成功', {
      userId: user.id,
      role: user.role
    });

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(401).json({ 
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}

export function authorize(...roles: ("talent" | "store")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      log('warn', '認可エラー: ユーザーが認証されていません');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      log('warn', '認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    log('info', '認可成功', {
      userId: req.user.id,
      role: req.user.role,
      requiredRoles: roles
    });

    next();
  };
}