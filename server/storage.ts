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
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      if (!result) {
        log('info', 'ユーザー取得完了', { id, found: false });
        return undefined;
      }

      // 明示的にUserオブジェクトを構築
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birth_date,
        location: result.location,
        preferredLocations: Array.isArray(result.preferred_locations) ? result.preferred_locations : [],
        role: result.role,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      log('info', 'ユーザー取得完了', {
        id: user.id,
        email: user.email,
        role: user.role
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
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!result) {
        log('info', 'メールアドレスでの取得完了', { email, found: false });
        return undefined;
      }

      // 明示的にUserオブジェクトを構築
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birth_date,
        location: result.location,
        preferredLocations: Array.isArray(result.preferred_locations) ? result.preferred_locations : [],
        role: result.role,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      log('info', 'メールアドレスでの取得完了', {
        email,
        found: true,
        role: user.role
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

      const [result] = await db
        .insert(users)
        .values({
          email: insertUser.email,
          username: insertUser.username,
          password: insertUser.password,
          birth_date: insertUser.birthDate,
          location: insertUser.location,
          preferred_locations: insertUser.preferredLocations,
          role: insertUser.role,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();

      if (!result) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      // 明示的にUserオブジェクトを構築
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birth_date,
        location: result.location,
        preferredLocations: Array.isArray(result.preferred_locations) ? result.preferred_locations : [],
        role: result.role,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      log('info', '新規ユーザー作成完了', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      return user;
    } catch (error) {
      log('error', '新規ユーザー作成エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      log('info', 'ユーザー更新開始', { id, data });

      const [result] = await db
        .update(users)
        .set({
          ...data,
          preferred_locations: data.preferredLocations,
          birth_date: data.birthDate,
          updated_at: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!result) {
        throw new Error('ユーザーの更新に失敗しました');
      }

      // 明示的にUserオブジェクトを構築
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birth_date,
        location: result.location,
        preferredLocations: Array.isArray(result.preferred_locations) ? result.preferred_locations : [],
        role: result.role,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      log('info', 'ユーザー更新完了', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      return user;
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