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
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // 新規登録APIエンドポイント
  app.post("/api/auth/register", async (req, res) => {
    try {
      log('info', 'Registration attempt', {
        username: req.body.username,
        role: req.body.role,
        timestamp: new Date().toISOString()
      });

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          message: "このユーザー名は既に使用されています"
        });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      log('info', 'User registered successfully', {
        userId: user.id,
        username: user.username,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      // JWTトークンを生成して返す
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
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "登録処理中にエラーが発生しました"
      });
    }
  });

  // ログインAPIエンドポイント
  app.post("/api/auth/login", async (req, res) => {
    try {
      log('info', 'Login attempt', {
        username: req.body.username,
        role: req.body.role,
        timestamp: new Date().toISOString()
      });

      passport.authenticate("local", (err, user, info) => {
        if (err) {
          log('error', 'Login error', {
            error: err.message,
            timestamp: new Date().toISOString()
          });
          return res.status(500).json({ message: "ログイン処理中にエラーが発生しました" });
        }

        if (!user) {
          return res.status(401).json({ message: "ユーザー名またはパスワードが間違っています" });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            log('error', 'Login session error', {
              error: loginErr.message,
              timestamp: new Date().toISOString()
            });
            return res.status(500).json({ message: "ログインセッションの作成に失敗しました" });
          }

          const token = require('./jwt').generateToken(user);

          log('info', 'Login successful', {
            userId: user.id,
            username: user.username,
            role: user.role,
            timestamp: new Date().toISOString()
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
      })(req, res);
    } catch (error) {
      log('error', 'Login error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "ログイン処理中にエラーが発生しました"
      });
    }
  });

  // ログアウトAPIエンドポイント
  app.post("/api/auth/logout", (req, res) => {
    try {
      if (req.user) {
        log('info', 'Logout attempt', {
          userId: (req.user as SelectUser).id,
          username: (req.user as SelectUser).username,
          timestamp: new Date().toISOString()
        });
      }

      req.logout((err) => {
        if (err) {
          log('error', 'Logout error', {
            error: err.message,
            timestamp: new Date().toISOString()
          });
          return res.status(500).json({ message: "ログアウト処理中にエラーが発生しました" });
        }
        return res.status(200).json({ message: "ログアウトしました" });
      });
    } catch (error) {
      log('error', 'Logout error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "ログアウト処理中にエラーが発生しました"
      });
    }
  });

  // ユーザー情報取得APIエンドポイント
  app.get("/api/auth/check", (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "認証されていません" });
      }

      const user = req.user as SelectUser;
      log('info', 'Auth check successful', {
        userId: user.id,
        username: user.username,
        role: user.role,
        timestamp: new Date().toISOString()
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
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        message: "認証確認中にエラーが発生しました"
      });
    }
  });
}