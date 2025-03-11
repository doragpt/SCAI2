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
  updateUser(id: number, data: Partial<User>): Promise<User>;
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

      if (user) {
        // データベースのスネークケースをキャメルケースに変換
        const formattedUser = {
          ...user,
          birthDate: user.birth_date,
          preferredLocations: Array.isArray(user.preferred_locations) 
            ? user.preferred_locations 
            : [],
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };

        log('info', 'ユーザー取得完了', {
          id,
          found: true,
          role: formattedUser.role,
          email: formattedUser.email
        });

        return formattedUser;
      }

      log('info', 'ユーザー取得完了', { id, found: false });
      return undefined;
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

      if (user) {
        // データベースのスネークケースをキャメルケースに変換
        const formattedUser = {
          ...user,
          birthDate: user.birth_date,
          preferredLocations: Array.isArray(user.preferred_locations) 
            ? user.preferred_locations 
            : [],
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };

        log('info', 'メールアドレスでの取得完了', {
          email,
          found: true,
          role: formattedUser.role
        });

        return formattedUser;
      }

      log('info', 'メールアドレスでの取得完了', { email, found: false });
      return undefined;
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
          role: "talent",
          preferredLocations: insertUser.preferredLocations || [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      if (!user) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      // データベースのスネークケースをキャメルケースに変換
      const formattedUser = {
        ...user,
        birthDate: user.birth_date,
        preferredLocations: Array.isArray(user.preferred_locations) 
          ? user.preferred_locations 
          : [],
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      log('info', '新規ユーザー作成完了', {
        id: formattedUser.id,
        email: formattedUser.email,
        username: formattedUser.username,
        role: formattedUser.role
      });

      return formattedUser;
    } catch (error) {
      log('error', '新規ユーザー作成エラー', {
        email: insertUser.email,
        username: insertUser.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      log('info', 'ユーザー更新開始', { id, data });

      const [updatedUser] = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error('ユーザーの更新に失敗しました');
      }

      // データベースのスネークケースをキャメルケースに変換
      const formattedUser = {
        ...updatedUser,
        birthDate: updatedUser.birth_date,
        preferredLocations: Array.isArray(updatedUser.preferred_locations) 
          ? updatedUser.preferred_locations 
          : [],
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      };

      log('info', 'ユーザー更新完了', {
        id,
        email: formattedUser.email,
        username: formattedUser.username
      });

      return formattedUser;
    } catch (error) {
      log('error', 'ユーザー更新エラー', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();