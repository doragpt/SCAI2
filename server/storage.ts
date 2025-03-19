import { users, type User, type InsertUser, type UserProfileUpdate } from "@shared/schema";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { log } from "./utils/logger";

const PgSession = connectPgSimple(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<UserProfileUpdate>): Promise<User>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
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
        log('info', 'ユーザーが見つかりません', { id });
        return undefined;
      }

      log('info', 'ユーザー取得成功', {
        id: result.id,
        email: result.email,
        username: result.username,
        birthDate: result.birthDate,
        location: result.location,
        preferredLocations: result.preferredLocations,
        role: result.role,
        displayName: result.displayName,
        phoneNumber: result.phoneNumber
      });

      return result;
    } catch (error) {
      log('error', 'ユーザー取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      log('info', 'メールアドレスでのユーザー取得開始', { email });

      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!result) {
        log('info', 'ユーザーが見つかりません', { email });
        return undefined;
      }

      log('info', 'ユーザー取得成功', {
        id: result.id,
        email: result.email,
        username: result.username,
        role: result.role
      });

      return result;
    } catch (error) {
      log('error', 'メールアドレスでのユーザー取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      log('info', '新規ユーザー作成開始', {
        email: insertUser.email,
        role: insertUser.role
      });

      const [result] = await db
        .insert(users)
        .values({
          ...insertUser,
          preferredLocations: insertUser.preferredLocations || [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      if (!result) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      log('info', '新規ユーザー作成完了', {
        id: result.id,
        email: result.email,
        role: result.role
      });

      return result;
    } catch (error) {
      log('error', '新規ユーザー作成エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: insertUser.email
      });
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<UserProfileUpdate>): Promise<User> {
    try {
      log('info', 'ユーザー更新開始', {
        id,
        updateData: {
          ...data,
          password: data.newPassword ? '********' : undefined
        }
      });

      const [result] = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!result) {
        throw new Error('ユーザーの更新に失敗しました');
      }

      log('info', 'ユーザー更新成功', {
        id: result.id,
        email: result.email,
        username: result.username,
        location: result.location,
        preferredLocations: result.preferredLocations,
        role: result.role,
        displayName: result.displayName,
        phoneNumber: result.phoneNumber
      });

      return result;
    } catch (error) {
      log('error', 'ユーザー更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();