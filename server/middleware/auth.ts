import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { log } from '../utils/logger';

// ユーザーロールの型定義
export type UserRole = "talent" | "store";

// 認証ミドルウェア
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.session || !req.isAuthenticated()) {
      return res.status(401).json({ message: '認証が必要です' });
    }

    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(500).json({ message: '認証処理中にエラーが発生しました' });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: '認証が必要です' });
      }

      const userRole = req.user.role as UserRole;
      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'アクセス権限がありません' });
      }

      next();
    } catch (error) {
      log('error', '認可エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ message: '認可処理中にエラーが発生しました' });
    }
  };
}

// リクエストバリデーションミドルウェア
export function validateRequest(schema: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

// ユーザー型の拡張
declare global {
  namespace Express {
    interface User {
      id: number;
      role: UserRole;
      username: string;
      displayName: string | null;
    }
  }
}