import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, transformUserToResponse, UserResponse } from "@shared/schema";
import { log } from "./utils/logger";

declare global {
  namespace Express {
    interface User extends UserResponse {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  try {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${derivedKey.toString('hex')}.${salt}`;
  } catch (error) {
    log('error', 'パスワードハッシュ化エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashedPassword, salt] = stored.split('.');
    const derivedKey = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(hashedPassword, 'hex');
    return timingSafeEqual(derivedKey, storedBuffer);
  } catch (error) {
    log('error', 'パスワード比較エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24時間
    },
    rolling: true // セッションの有効期限を自動延長
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            log('warn', 'ログイン失敗: ユーザーが見つかりません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            log('warn', 'ログイン失敗: パスワードが一致しません', { email });
            return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
          }

          const userResponse = transformUserToResponse(user);
          log('info', 'ログイン成功', {
            userId: userResponse.id,
            email: userResponse.email,
            role: userResponse.role
          });

          return done(null, userResponse);
        } catch (error) {
          log('error', 'ログインエラー', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email
          });
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    log('info', 'セッションシリアライズ', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        log('warn', 'セッションデシリアライズ失敗: ユーザーが見つかりません', { id });
        return done(null, false);
      }

      const userResponse = transformUserToResponse(user);
      log('info', 'セッションデシリアライズ成功', {
        userId: userResponse.id,
        email: userResponse.email,
        role: userResponse.role
      });

      done(null, userResponse);
    } catch (error) {
      log('error', 'セッションデシリアライズエラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      done(error);
    }
  });

  return app;
}

export { hashPassword, comparePasswords };