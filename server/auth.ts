import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  try {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  } catch (error) {
    log('error', 'Password hashing failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('パスワードのハッシュ化に失敗しました');
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    log('error', 'Password comparison failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        log('info', 'Authentication attempt', { username });

        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }

        log('info', 'Authentication successful', {
          userId: user.id,
          username: user.username
        });

        return done(null, user);
      } catch (error) {
        log('error', 'Authentication error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          username
        });
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    log('debug', 'Serializing user', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      log('debug', 'Deserializing user', { userId: id });
      const user = await storage.getUser(id);
      if (!user) {
        log('warn', 'User not found during deserialization', { userId: id });
        return done(new Error('User not found'));
      }
      done(null, user);
    } catch (error) {
      log('error', 'Deserialize user error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id
      });
      done(error);
    }
  });

  // 新規登録APIエンドポイント
  app.post("/api/auth/register", async (req, res) => {
    try {
      log('info', 'Registration attempt', {
        username: req.body.username,
        role: req.body.role
      });

      if (!req.body.username || !req.body.password) {
        return res.status(400).json({
          message: "ユーザー名とパスワードは必須です"
        });
      }

      // 既存ユーザーチェック
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          message: "このユーザー名は既に使用されています"
        });
      }

      // パスワードのハッシュ化
      const hashedPassword = await hashPassword(req.body.password);

      // ユーザー作成
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        createdAt: new Date()
      });

      log('info', 'User registered successfully', {
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // JWTトークンの生成
      const token = require('./jwt').generateToken(user);

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          displayName: user.displayName,
          location: user.location,
          birthDate: user.birthDate,
          preferredLocations: user.preferredLocations
        }
      });
    } catch (error) {
      log('error', 'Registration error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        message: "登録処理中にエラーが発生しました"
      });
    }
  });

  // ログインAPIエンドポイント
  app.post("/api/auth/login", (req, res, next) => {
    log('info', 'Login attempt', {
      username: req.body.username,
      role: req.body.role
    });

    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        message: "ユーザー名とパスワードは必須です"
      });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'Login error', { error: err });
        return res.status(500).json({
          message: "ログイン処理中にエラーが発生しました"
        });
      }

      if (!user) {
        return res.status(401).json({
          message: "ユーザー名またはパスワードが間違っています"
        });
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          log('error', 'Login session error', { error: loginErr });
          return res.status(500).json({
            message: "ログインセッションの作成に失敗しました"
          });
        }

        const token = require('./jwt').generateToken(user);

        log('info', 'Login successful', {
          userId: user.id,
          username: user.username,
          role: user.role
        });

        return res.status(200).json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: user.displayName,
            location: user.location,
            birthDate: user.birthDate,
            preferredLocations: user.preferredLocations
          }
        });
      });
    })(req, res, next);
  });

  // ログアウトAPIエンドポイント
  app.post("/api/auth/logout", (req, res) => {
    try {
      if (req.user) {
        log('info', 'Logout attempt', {
          userId: (req.user as SelectUser).id,
          username: (req.user as SelectUser).username
        });
      }

      req.logout((err) => {
        if (err) {
          log('error', 'Logout error', { error: err });
          return res.status(500).json({ message: "ログアウト処理中にエラーが発生しました" });
        }
        return res.status(200).json({ message: "ログアウトしました" });
      });
    } catch (error) {
      log('error', 'Logout error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        message: "ログアウト処理中にエラーが発生しました"
      });
    }
  });

  // セッションチェックAPIエンドポイント
  app.get("/api/auth/check", (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "認証されていません" });
      }

      const user = req.user as SelectUser;
      log('info', 'Auth check successful', {
        userId: user.id,
        username: user.username,
        role: user.role
      });

      return res.status(200).json({
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        location: user.location,
        birthDate: user.birthDate,
        preferredLocations: user.preferredLocations
      });
    } catch (error) {
      log('error', 'Auth check error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        message: "認証確認中にエラーが発生しました"
      });
    }
  });
}