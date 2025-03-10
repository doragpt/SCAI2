import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { log } from "./utils/logger";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
        found: !!user
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      log('info', 'ユーザー名での取得開始', { username });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      log('info', 'ユーザー名での取得完了', {
        username,
        found: !!user
      });
      return user;
    } catch (error) {
      log('error', 'ユーザー名での取得エラー', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      log('info', '新規ユーザー作成開始', {
        username: insertUser.username,
        role: insertUser.role
      });

      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          createdAt: new Date(),
          updatedAt: new Date(),
          birthDateModified: false,
          preferredLocations: insertUser.preferredLocations || []
        })
        .returning();

      if (!user) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      log('info', '新規ユーザー作成完了', {
        id: user.id,
        username: user.username,
        role: user.role
      });

      return user;
    } catch (error) {
      log('error', '新規ユーザー作成エラー', {
        username: insertUser.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();