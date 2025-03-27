import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

// ユーザーロールの型定義
export type UserRole = "talent" | "store";

// ユーザー型の拡張
declare global {
  namespace Express {
    interface User {
      id: number;
      role: UserRole;
      email: string;
      display_name: string | null;
      location: string;
      service_type: string | null;
    }
  }
}

// 認証ミドルウェア
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    log('info', '認証チェック開始', {
      path: req.path,
      method: req.method,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? {
        id: req.user.id,
        role: req.user.role,
        display_name: req.user.display_name,
        service_type: req.user.service_type
      } : null,
      cookies: req.cookies ? Object.keys(req.cookies) : [],
      headers: {
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      }
    });

    if (!req.isAuthenticated() || !req.user) {
      log('warn', '未認証アクセス', {
        path: req.path,
        method: req.method,
        sessionID: req.sessionID || 'session-id-missing',
        cookies: req.cookies ? Object.keys(req.cookies) : []
      });
      return res.status(401).json({ 
        success: false,
        message: '認証が必要です'
      });
    }

    // セッションの有効性を確認
    if (!req.session) {
      log('warn', 'セッションオブジェクトなし', {
        path: req.path,
        sessionID: req.sessionID
      });
      return res.status(401).json({ 
        success: false,
        message: 'セッションが無効です' 
      });
    }

    // Passport.jsによる認証が成功していれば、セッションの詳細チェックは行わない
    // req.isAuthenticated() が true であれば、セッションは有効と判断する

    log('info', '認証成功', {
      userId: req.user.id,
      role: req.user.role,
      display_name: req.user.display_name,
      service_type: req.user.service_type,
      path: req.path
    });

    next();
  } catch (error) {
    log('error', '認証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : '認証に失敗しました'
    });
  }
}

// ロールベースの認可ミドルウェア
export function authorize(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      log('warn', '認可エラー: ユーザーが認証されていません');
      return res.status(401).json({ 
        success: false,
        message: '認証が必要です' 
      });
    }

    if (req.user.role !== role) {
      log('warn', '認可エラー: 権限不足', {
        userRole: req.user.role,
        requiredRole: role,
        display_name: req.user.display_name,
        service_type: req.user.service_type
      });
      return res.status(403).json({ 
        success: false,
        message: `この操作には${role === 'store' ? '店舗' : '女性'}アカウントが必要です`
      });
    }

    // 店舗ユーザーの場合、必要な情報が設定されているか確認
    if (role === 'store' && (!req.user.display_name || !req.user.service_type)) {
      log('warn', '認可エラー: 店舗情報不足', {
        userId: req.user.id,
        display_name: req.user.display_name,
        service_type: req.user.service_type
      });
      return res.status(403).json({ 
        success: false,
        message: '店舗情報が不完全です。管理者にお問い合わせください。'
      });
    }

    log('info', '認可成功', {
      userId: req.user.id,
      role: req.user.role,
      display_name: req.user.display_name,
      service_type: req.user.service_type,
      requiredRole: role
    });

    next();
  };
}