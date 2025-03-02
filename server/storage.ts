import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

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
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log('Getting user by ID:', id);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      console.log('Found user by ID:', user);
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log('Getting user by username:', username);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      console.log('Found user by username:', user);
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('Creating user:', insertUser);

      // トランザクションを使用してユーザー作成
      const [user] = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            ...insertUser,
            createdAt: new Date(),
            age: null,
            birthDate: insertUser.birthDate || null,
            preferredLocations: insertUser.preferredLocations || [],
          })
          .returning();

        if (!newUser) {
          throw new Error('ユーザーの作成に失敗しました');
        }

        return [newUser];
      });

      console.log('Created user with ID:', user.id);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();