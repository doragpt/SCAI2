import { users, type User, type InsertUser, type TalentProfile, type StoreProfile, type Application } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createTalentProfile(userId: number, profile: Omit<TalentProfile, "id" | "userId">): Promise<TalentProfile>;
  getTalentProfiles(): Promise<TalentProfile[]>;
  createApplication(application: Omit<Application, "id" | "createdAt">): Promise<Application>;
  getStoreApplications(storeId: number): Promise<Application[]>;
  getStoreProfiles(): Promise<StoreProfile[]>;
  getStoreProfile(id: number): Promise<StoreProfile | undefined>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private talentProfiles: Map<number, TalentProfile>;
  private storeProfiles: Map<number, StoreProfile>;
  private applications: Map<number, Application>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.talentProfiles = new Map();
    this.storeProfiles = new Map();
    this.applications = new Map();
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
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async createTalentProfile(userId: number, profile: Omit<TalentProfile, "id" | "userId">): Promise<TalentProfile> {
    const id = this.currentId++;
    const talentProfile: TalentProfile = { ...profile, id, userId };
    this.talentProfiles.set(id, talentProfile);
    return talentProfile;
  }

  async getTalentProfiles(): Promise<TalentProfile[]> {
    return Array.from(this.talentProfiles.values());
  }

  async createApplication(application: Omit<Application, "id" | "createdAt">): Promise<Application> {
    const id = this.currentId++;
    const newApplication: Application = { ...application, id, createdAt: new Date() };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async getStoreApplications(storeId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.storeId === storeId);
  }

  async getStoreProfiles(): Promise<StoreProfile[]> {
    return Array.from(this.storeProfiles.values());
  }

  async getStoreProfile(id: number): Promise<StoreProfile | undefined> {
    return this.storeProfiles.get(id);
  }
}

export const storage = new MemStorage();