import { users, type User, type InsertUser, talentProfiles, type TalentProfile, type TalentProfileData } from "@shared/schema";
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
  getTalentProfile(userId: number): Promise<TalentProfileData | undefined>;
  createOrUpdateTalentProfile(userId: number, data: TalentProfileData): Promise<TalentProfileData>;
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
        log('info', 'ユーザーが見つかりません', { id });
        return undefined;
      }

      // データベースのスネークケースからキャメルケースに変換
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birthDate, 
        location: result.location,
        preferredLocations: Array.isArray(result.preferredLocations) 
          ? result.preferredLocations 
          : [],
        role: result.role,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };

      log('info', 'ユーザー取得成功', {
        id: user.id,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate 
      });

      return user;
    } catch (error) {
      log('error', 'ユーザー取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
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

      // データベースのスネークケースからキャメルケースに変換
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birthDate, 
        location: result.location,
        preferredLocations: Array.isArray(result.preferredLocations) 
          ? result.preferredLocations 
          : [],
        role: result.role,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };

      log('info', 'ユーザー取得成功', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      return user;
    } catch (error) {
      log('error', 'メールアドレスでのユーザー取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
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
          email: insertUser.email,
          username: insertUser.username,
          password: insertUser.password,
          birthDate: insertUser.birthDate, 
          location: insertUser.location,
          preferredLocations: insertUser.preferredLocations,
          role: insertUser.role,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      if (!result) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      // データベースのスネークケースからキャメルケースに変換
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birthDate, 
        location: result.location,
        preferredLocations: Array.isArray(result.preferredLocations) 
          ? result.preferredLocations 
          : [],
        role: result.role,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
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

      const updateData = {
        username: data.username,
        birthDate: data.birthDate, 
        location: data.location,
        preferredLocations: data.preferredLocations,
        password: data.password, 
        updatedAt: new Date()
      };

      log('info', '更新データ', updateData);

      const [result] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!result) {
        throw new Error('ユーザーの更新に失敗しました');
      }

      // データベースのスネークケースからキャメルケースに変換
      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birthDate: result.birthDate, 
        location: result.location,
        preferredLocations: Array.isArray(result.preferredLocations) 
          ? result.preferredLocations 
          : [],
        role: result.role,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };

      log('info', 'ユーザー更新成功', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      return user;
    } catch (error) {
      log('error', 'ユーザー更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getTalentProfile(userId: number): Promise<TalentProfileData | undefined> {
    try {
      log('info', 'タレントプロフィール取得開始', { userId });

      const [result] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId));

      if (!result) {
        log('info', 'タレントプロフィールが見つかりません', { userId });
        return undefined;
      }

      // データベースのレコードをTalentProfileData型に変換
      const profile: TalentProfileData = {
        lastName: result.lastName,
        firstName: result.firstName,
        lastNameKana: result.lastNameKana,
        firstNameKana: result.firstNameKana,
        location: result.location,
        nearestStation: result.nearestStation,
        availableIds: result.availableIds,
        canProvideResidenceRecord: result.canProvideResidenceRecord,
        height: result.height,
        weight: result.weight,
        cupSize: result.cupSize,
        bust: result.bust,
        waist: result.waist,
        hip: result.hip,
        faceVisibility: result.faceVisibility,
        canPhotoDiary: result.canPhotoDiary,
        canHomeDelivery: result.canHomeDelivery,
        ngOptions: result.ngOptions,
        allergies: result.allergies,
        smoking: result.smoking,
        hasSnsAccount: result.hasSnsAccount,
        snsUrls: result.snsUrls,
        currentStores: result.currentStores,
        previousStores: result.previousStores,
        photoDiaryUrls: result.photoDiaryUrls,
        selfIntroduction: result.selfIntroduction,
        notes: result.notes,
        estheOptions: result.estheOptions,
        hasEstheExperience: result.hasEstheExperience,
        estheExperiencePeriod: result.estheExperiencePeriod,
        preferredLocations: result.preferredLocations,
        ngLocations: result.ngLocations,
        bodyMark: result.bodyMark,
        photos: result.photos
      };

      log('info', 'タレントプロフィール取得成功', { userId });
      return profile;

    } catch (error) {
      log('error', 'タレントプロフィール取得エラー', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createOrUpdateTalentProfile(userId: number, data: TalentProfileData): Promise<TalentProfileData> {
    try {
      log('info', 'タレントプロフィール作成/更新開始', { userId });

      // 既存のプロフィールを確認
      const [existingProfile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId));

      let result;
      if (existingProfile) {
        // 更新
        [result] = await db
          .update(talentProfiles)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(talentProfiles.userId, userId))
          .returning();
      } else {
        // 新規作成
        [result] = await db
          .insert(talentProfiles)
          .values({
            userId,
            ...data,
            updatedAt: new Date()
          })
          .returning();
      }

      if (!result) {
        throw new Error('タレントプロフィールの保存に失敗しました');
      }

      // 保存したデータをTalentProfileData型に変換して返す
      const profile: TalentProfileData = {
        lastName: result.lastName,
        firstName: result.firstName,
        lastNameKana: result.lastNameKana,
        firstNameKana: result.firstNameKana,
        location: result.location,
        nearestStation: result.nearestStation,
        availableIds: result.availableIds,
        canProvideResidenceRecord: result.canProvideResidenceRecord,
        height: result.height,
        weight: result.weight,
        cupSize: result.cupSize,
        bust: result.bust,
        waist: result.waist,
        hip: result.hip,
        faceVisibility: result.faceVisibility,
        canPhotoDiary: result.canPhotoDiary,
        canHomeDelivery: result.canHomeDelivery,
        ngOptions: result.ngOptions,
        allergies: result.allergies,
        smoking: result.smoking,
        hasSnsAccount: result.hasSnsAccount,
        snsUrls: result.snsUrls,
        currentStores: result.currentStores,
        previousStores: result.previousStores,
        photoDiaryUrls: result.photoDiaryUrls,
        selfIntroduction: result.selfIntroduction,
        notes: result.notes,
        estheOptions: result.estheOptions,
        hasEstheExperience: result.hasEstheExperience,
        estheExperiencePeriod: result.estheExperiencePeriod,
        preferredLocations: result.preferredLocations,
        ngLocations: result.ngLocations,
        bodyMark: result.bodyMark,
        photos: result.photos
      };

      log('info', 'タレントプロフィール保存成功', { userId });
      return profile;

    } catch (error) {
      log('error', 'タレントプロフィール保存エラー', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();