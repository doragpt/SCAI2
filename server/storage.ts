import { users, talentProfiles, type User, type InsertUser, type TalentProfileData } from "@shared/schema";
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
  getTalentProfile(userId: number): Promise<TalentProfileData | null>;
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

  // プロフィールデータを取得
  async getTalentProfile(userId: number): Promise<TalentProfileData | null> {
    try {
      log('info', 'タレントプロフィール取得開始', { userId });

      // プロフィールテーブルからデータを取得
      const [result] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId));

      if (!result) {
        log('info', 'タレントプロフィールが見つかりません', { userId });
        return null;
      }

      // 明示的に型を指定してデータを変換
      const profileData: TalentProfileData = {
        userId: result.userId || '',
        lastName: result.lastName || '',
        firstName: result.firstName || '',
        lastNameKana: result.lastNameKana || '',
        firstNameKana: result.firstNameKana || '',
        location: result.location || '',
        nearestStation: result.nearestStation || '',
        availableIds: result.availableIds || [],
        canProvideResidenceRecord: !!result.canProvideResidenceRecord,
        height: result.height || 0,
        weight: result.weight || 0,
        cupSize: result.cupSize || '',
        bust: result.bust || 0,
        waist: result.waist || 0,
        hip: result.hip || 0,
        bodyMark: result.bodyMark || '',
        smoking: typeof result.smoking === 'boolean' ? {
          enabled: result.smoking,
          types: [],
          others: []
        } : result.smoking || {
          enabled: false,
          types: [],
          others: []
        },
        // 顔出しの値を適切に変換
        faceVisibility: typeof result.faceVisibility === 'string'
          ? result.faceVisibility
          : result.faceVisibility === true
            ? "全出し"
            : result.faceVisibility === false
              ? "全隠し"
              : "全隠し",
        hasEstheExperience: !!result.hasEstheExperience,
        estheExperiencePeriod: result.estheExperiencePeriod || '',
        estheOptions: result.estheOptions || [],
        currentStores: result.currentStores || [],
        previousStores: result.previousStores || [],
        selfIntroduction: result.selfIntroduction || '',
        notes: result.notes || '',
        preferredLocations: result.preferredLocations || [],
        ngLocations: result.ngLocations || [],
        canPhotoDiary: !!result.canPhotoDiary,
        canHomeDelivery: !!result.canHomeDelivery,
        ngOptions: result.ngOptions || [],
        allergies: result.allergies || [],
        hasSnsAccount: !!result.hasSnsAccount,
        snsUrls: result.snsUrls || [],
        photoDiaryUrls: result.photoDiaryUrls || [],
        photos: result.photos || []
      };

      log('info', 'タレントプロフィール取得成功', {
        userId,
        profileData: {
          lastName: profileData.lastName,
          firstName: profileData.firstName,
          lastNameKana: profileData.lastNameKana,
          firstNameKana: profileData.firstNameKana,
          location: profileData.location,
          nearestStation: profileData.nearestStation,
          faceVisibility: profileData.faceVisibility // 追加
        }
      });

      return profileData;
    } catch (error) {
      log('error', 'タレントプロフィール取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  async createOrUpdateTalentProfile(userId: number, data: TalentProfileData): Promise<TalentProfileData> {
    try {
      log('info', 'タレントプロフィール作成/更新開始', {
        userId,
        inputData: {
          lastName: data.lastName,
          firstName: data.firstName,
          lastNameKana: data.lastNameKana,
          firstNameKana: data.firstNameKana,
          location: data.location,
          nearestStation: data.nearestStation,
          height: data.height,
          weight: data.weight,
          cupSize: data.cupSize,
          faceVisibility: data.faceVisibility,
        }
      });

      // プロフィールの存在確認
      const [existingProfile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.userId, userId));

      let result;
      const profileData = {
        ...data,
        userId,
        updatedAt: new Date(),
      };

      if (existingProfile) {
        // 更新
        [result] = await db
          .update(talentProfiles)
          .set(profileData)
          .where(eq(talentProfiles.userId, userId))
          .returning();
      } else {
        // 新規作成
        [result] = await db
          .insert(talentProfiles)
          .values(profileData)
          .returning();
      }

      if (!result) {
        throw new Error('プロフィールの保存に失敗しました');
      }

      log('info', 'タレントプロフィール作成/更新成功', {
        userId,
        savedProfile: {
          lastName: result.lastName,
          firstName: result.firstName,
          lastNameKana: result.lastNameKana,
          firstNameKana: result.firstNameKana,
          location: result.location,
          nearestStation: result.nearestStation,
          height: result.height,
          weight: result.weight,
          cupSize: result.cupSize,
          faceVisibility: result.faceVisibility,
        }
      });

      return result as TalentProfileData;
    } catch (error) {
      log('error', 'タレントプロフィール作成/更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
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
        updatedAt: result.updatedAt,
        displayName: result.username // displayName を username から設定
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
        updatedAt: result.updatedAt,
        displayName: result.username // displayName を username から設定
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
          displayName: insertUser.username, // displayName を username として設定
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
        updatedAt: result.updatedAt,
        displayName: result.username // displayName を username から設定
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
        displayName: data.username, // displayName を username と同期
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
        updatedAt: result.updatedAt,
        displayName: result.username // displayName を username から設定
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
}

export const storage = new DatabaseStorage();