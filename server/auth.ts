import type { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./utils/logger";
import { generateToken, verifyToken, extractTokenFromHeader } from './jwt';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function sanitizeUser(user: SelectUser) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

export function setupAuth(app: Express) {
  // ログインAPI
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが間違っています" });
      }

      const token = generateToken(user);
      res.json({
        token,
        user: sanitizeUser(user)
      });
    } catch (error) {
      log('error', 'ログインエラー', { error });
      res.status(500).json({ message: "ログイン処理中にエラーが発生しました" });
    }
  });

  // 認証チェックAPI
  app.get("/api/check", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const token = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(token);

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "ユーザーが見つかりません" });
      }

      res.json(sanitizeUser(user));
    } catch (error) {
      log('error', '認証チェックエラー', { error });
      res.status(401).json({ message: "認証に失敗しました" });
    }
  });

  // ユーザー登録API
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, ...userData } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "このメールアドレスは既に使用されています" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        ...userData,
        createdAt: new Date()
      });

      const token = generateToken(user);
      res.status(201).json({
        token,
        user: sanitizeUser(user)
      });
    } catch (error) {
      log('error', '登録エラー', { error });
      res.status(500).json({ message: "登録処理中にエラーが発生しました" });
    }
  });

  // ユーザー情報取得API
  app.get("/api/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const token = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(token);

      const userData = await storage.getUser(decoded.userId);
      if (!userData) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      log('info', 'ユーザー情報取得', {
        id: userData.id,
        email: userData.email,
        role: userData.role
      });

      res.json(sanitizeUser(userData));
    } catch (error) {
      log('error', 'ユーザー情報取得エラー', { error });
      res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });


  // ユーザー情報更新API
  app.patch("/api/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        log('warn', '認証なしでの更新試行');
        return res.status(401).json({ message: "認証が必要です" });
      }

      const token = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(token);
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({message: "ユーザーが見つかりません"})
      }

      // リクエストデータをログ出力
      log('info', '更新リクエストデータ', req.body);

      const { username, location, preferredLocations, currentPassword, newPassword } = req.body;

      // パスワード変更のリクエストがある場合
      if (currentPassword && newPassword) {
        // 現在のパスワードを確認
        const isValidPassword = await comparePasswords(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: "現在のパスワードが正しくありません" });
        }

        // 新しいパスワードをハッシュ化
        const hashedPassword = await hashPassword(newPassword);

        // ユーザー情報を更新（パスワードを含む）
        const updatedUser = await storage.updateUser(req.user.id, {
          username,
          location,
          preferredLocations,
          password: hashedPassword
        });

        log('info', 'ユーザー情報更新成功（パスワード変更含む）', {
          id: updatedUser.id,
          email: updatedUser.email
        });

        return res.json({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          birthDate: updatedUser.birthDate,
          location: updatedUser.location,
          preferredLocations: updatedUser.preferredLocations || [],
          role: updatedUser.role
        });
      }

      // 通常の情報更新
      const updatedUser = await storage.updateUser(decoded.userId, {
        username,
        location,
        preferredLocations
      });

      log('info', 'ユーザー情報更新成功', {
        id: updatedUser.id,
        email: updatedUser.email
      });

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        birthDate: updatedUser.birthDate,
        location: updatedUser.location,
        preferredLocations: updatedUser.preferredLocations || [],
        role: updatedUser.role
      });
    } catch (error) {
      log('error', 'ユーザー情報更新エラー', { error });
      res.status(500).json({ message: "ユーザー情報の更新に失敗しました" });
    }
  });
}

export { hashPassword, comparePasswords };