import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { log } from "./utils/logger";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24時間でクリア
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      log('info', 'ユーザー取得開始', { id });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      log('info', 'ユーザー取得完了', {
        id,
        found: !!user,
        role: user?.role,
        email: user?.email
      });
      return user;
    } catch (error) {
      log('error', 'ユーザー取得エラー', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      log('info', 'メールアドレスでの取得開始', { email });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      log('info', 'メールアドレスでの取得完了', {
        email,
        found: !!user,
        role: user?.role
      });
      return user;
    } catch (error) {
      log('error', 'メールアドレスでの取得エラー', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      log('info', '新規ユーザー作成開始', {
        email: insertUser.email,
        username: insertUser.username,
        role: insertUser.role
      });

      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          birthDate: new Date(insertUser.birthDate),
          birthDateModified: false,
          preferredLocations: insertUser.preferredLocations || [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      if (!user) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      log('info', '新規ユーザー作成完了', {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      });

      return user;
    } catch (error) {
      log('error', '新規ユーザー作成エラー', {
        email: insertUser.email,
        username: insertUser.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();