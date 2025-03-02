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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('Creating user with data:', insertUser);

      const id = this.currentId++;
      const user: User = {
        ...insertUser,
        id,
        createdAt: new Date(),
        age: null,
        birthDate: insertUser.birthDate || null,
        preferredLocations: insertUser.preferredLocations || [],
      };

      console.log('Created user object:', user);
      this.users.set(id, user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

export const storage = new MemStorage();