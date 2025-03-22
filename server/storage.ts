import { users, store_profiles, talentProfiles, type User, type StoreProfile, type InsertStoreProfile, type TalentProfileData } from "@shared/schema";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { log } from "./utils/logger";

// InsertUser型の定義
type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;

const PgSession = connectPgSimple(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getTalentProfile(userId: number): Promise<TalentProfileData | null>;
  createOrUpdateTalentProfile(userId: number, data: TalentProfileData): Promise<TalentProfileData>;
  getStoreProfile(userId: number): Promise<StoreProfile | null>;
  createOrUpdateStoreProfile(userId: number, data: InsertStoreProfile): Promise<StoreProfile>;
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

      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birth_date: result.birth_date,
        location: result.location,
        service_type: result.service_type,
        preferred_locations: result.preferred_locations,
        role: result.role,
        display_name: result.display_name,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      log('info', 'ユーザー取得成功', {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        location: user.location,
        service_type: user.service_type
      });

      return user;
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

      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birth_date: result.birth_date,
        location: result.location,
        service_type: result.service_type,
        preferred_locations: result.preferred_locations,
        role: result.role,
        display_name: result.display_name,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      log('info', 'ユーザー取得成功', {
        id: user.id,
        email: user.email,
        role: user.role,
        service_type: user.service_type
      });

      return user;
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
        role: insertUser.role,
        service_type: insertUser.service_type
      });

      const [result] = await db
        .insert(users)
        .values({
          email: insertUser.email,
          username: insertUser.username,
          password: insertUser.password,
          birth_date: insertUser.birth_date,
          location: insertUser.location,
          service_type: insertUser.service_type,
          preferred_locations: insertUser.preferred_locations,
          role: insertUser.role,
          display_name: insertUser.display_name,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();

      if (!result) {
        throw new Error('ユーザーの作成に失敗しました');
      }

      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birth_date: result.birth_date,
        location: result.location,
        service_type: result.service_type,
        preferred_locations: result.preferred_locations,
        role: result.role,
        display_name: result.display_name,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      log('info', '新規ユーザー作成完了', {
        id: user.id,
        email: user.email,
        role: user.role,
        service_type: user.service_type
      });

      return user;
    } catch (error) {
      log('error', '新規ユーザー作成エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: insertUser.email
      });
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      log('info', 'ユーザー更新開始', { id });

      const updateData = {
        ...data,
        updated_at: new Date()
      };

      const [result] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!result) {
        throw new Error('ユーザーの更新に失敗しました');
      }

      const user: User = {
        id: result.id,
        email: result.email,
        username: result.username,
        password: result.password,
        birth_date: result.birth_date,
        location: result.location,
        service_type: result.service_type,
        preferred_locations: result.preferred_locations,
        role: result.role,
        display_name: result.display_name,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      log('info', 'ユーザー更新成功', {
        id: user.id,
        email: user.email,
        role: user.role,
        service_type: user.service_type
      });

      return user;
    } catch (error) {
      log('error', 'ユーザー更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  async getTalentProfile(userId: number): Promise<TalentProfileData | null> {
    try {
      log('info', 'タレントプロフィール取得開始', { userId });

      const [result] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.user_id, userId));

      if (!result) {
        log('info', 'タレントプロフィールが見つかりません', { userId });
        return null;
      }

      const profileData: TalentProfileData = {
        last_name: result.last_name || '',
        first_name: result.first_name || '',
        last_name_kana: result.last_name_kana || '',
        first_name_kana: result.first_name_kana || '',
        location: result.location || '',
        nearest_station: result.nearest_station || '',
        available_ids: result.available_ids || { types: [], others: [] },
        can_provide_residence_record: !!result.can_provide_residence_record,
        can_provide_std_test: !!result.can_provide_std_test,
        height: result.height || 0,
        weight: result.weight || 0,
        cup_size: result.cup_size || 'A',
        bust: result.bust || null,
        waist: result.waist || null,
        hip: result.hip || null,
        body_mark: result.body_mark || { has_body_mark: false, details: '', others: [] },
        smoking: result.smoking || {
          enabled: false,
          types: [],
          others: []
        },
        face_visibility: result.face_visibility || "全隠し",
        has_esthe_experience: !!result.has_esthe_experience,
        esthe_experience_period: result.esthe_experience_period || '',
        esthe_options: result.esthe_options || { available: [], ng_options: [] },
        current_stores: result.current_stores || [],
        previous_stores: result.previous_stores || [],
        self_introduction: result.self_introduction || '',
        notes: result.notes || '',
        preferred_locations: result.preferred_locations || [],
        ng_locations: result.ng_locations || [],
        can_photo_diary: !!result.can_photo_diary,
        can_home_delivery: !!result.can_home_delivery,
        ng_options: result.ng_options || { common: [], others: [] },
        allergies: result.allergies || { types: [], others: [], has_allergy: false },
        has_sns_account: !!result.has_sns_account,
        sns_urls: result.sns_urls || [],
        photo_diary_urls: result.photo_diary_urls || [],
        photos: result.photos || []
      };

      log('info', 'タレントプロフィール取得成功', {
        userId,
        profileData: {
          last_name: profileData.last_name,
          first_name: profileData.first_name,
          last_name_kana: profileData.last_name_kana,
          first_name_kana: profileData.first_name_kana,
          location: profileData.location,
          nearest_station: profileData.nearest_station,
          face_visibility: profileData.face_visibility
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
          last_name: data.last_name,
          first_name: data.first_name,
          last_name_kana: data.last_name_kana,
          first_name_kana: data.first_name_kana,
          location: data.location,
          nearest_station: data.nearest_station,
          height: data.height,
          weight: data.weight,
          cup_size: data.cup_size,
          face_visibility: data.face_visibility,
        }
      });

      // ユーザー情報を取得して生年月日を利用可能にする
      const userData = await this.getUser(userId);
      
      const [existingProfile] = await db
        .select()
        .from(talentProfiles)
        .where(eq(talentProfiles.user_id, userId));

      let result;
      const profileData = {
        ...data,
        user_id: userId,
        // ユーザーの生年月日をタレントプロフィールにも反映
        birth_date: userData?.birth_date,
        updated_at: new Date(),
      };

      if (existingProfile) {
        [result] = await db
          .update(talentProfiles)
          .set(profileData)
          .where(eq(talentProfiles.user_id, userId))
          .returning();
      } else {
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
          last_name: result.last_name,
          first_name: result.first_name,
          last_name_kana: result.last_name_kana,
          first_name_kana: result.first_name_kana,
          location: result.location,
          nearest_station: result.nearest_station,
          height: result.height,
          weight: result.weight,
          cup_size: result.cup_size,
          face_visibility: result.face_visibility,
        }
      });

      return {
        ...result,
      } as unknown as TalentProfileData;
    } catch (error) {
      log('error', 'タレントプロフィール作成/更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  async getStoreProfile(userId: number): Promise<StoreProfile | null> {
    try {
      log('info', '店舗プロフィール取得開始', { userId });

      const [result] = await db
        .select()
        .from(store_profiles)
        .where(eq(store_profiles.user_id, userId));

      if (!result) {
        log('info', '店舗プロフィールが見つかりません', { userId });
        return null;
      }

      log('info', '店舗プロフィール取得成功', {
        userId,
        business_name: result.business_name,
        service_type: result.service_type
      });

      return result;
    } catch (error) {
      log('error', '店舗プロフィール取得エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  async createOrUpdateStoreProfile(userId: number, data: InsertStoreProfile): Promise<StoreProfile> {
    try {
      log('info', '店舗プロフィール作成/更新開始', {
        userId,
        business_name: data.business_name,
        service_type: data.service_type
      });

      const [existingProfile] = await db
        .select()
        .from(store_profiles)
        .where(eq(store_profiles.user_id, userId));

      let result;
      const profileData = {
        ...data,
        user_id: userId,
        updated_at: new Date(),
      };

      if (existingProfile) {
        [result] = await db
          .update(store_profiles)
          .set(profileData)
          .where(eq(store_profiles.user_id, userId))
          .returning();
      } else {
        [result] = await db
          .insert(store_profiles)
          .values(profileData)
          .returning();
      }

      if (!result) {
        throw new Error('店舗プロフィールの保存に失敗しました');
      }

      log('info', '店舗プロフィール作成/更新成功', {
        userId,
        business_name: result.business_name,
        service_type: result.service_type
      });

      return result;
    } catch (error) {
      log('error', '店舗プロフィール作成/更新エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();