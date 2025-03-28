import { users, store_profiles, talentProfiles, type StoreProfile, type InsertStoreProfile, type TalentProfileData } from "@shared/schema";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import memorystore from "memorystore";
import { log } from "./utils/logger";

// User型とInsertUser型の定義
type User = typeof users.$inferSelect;
type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;

const PgSession = connectPgSimple(session);
const MemoryStore = memorystore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getTalentProfile(userId: number): Promise<TalentProfileData | null>;
  createOrUpdateTalentProfile(userId: number, data: TalentProfileData): Promise<TalentProfileData>;
  getStoreProfile(userId: number): Promise<StoreProfile | null>;
  createOrUpdateStoreProfile(userId: number, data: InsertStoreProfile): Promise<StoreProfile>;
  getDesignSettings(userId: number): Promise<any | null>;
  updateDesignSettings(userId: number, data: any): Promise<any>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // メモリベースのセッションストアを使用
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24時間ごとに古いセッションをプルーニング
    });
    
    // PostgreSQLベースのセッションストアコメントアウト（問題が解決したら戻す）
    /*
    this.sessionStore = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
    */
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

      // タレントプロフィールとユーザー情報を同時に取得するクエリ
      // このクエリはtalentProfilesテーブルとusersテーブルを結合して、birth_dateを含める
      const query = `
        SELECT tp.*, u.birth_date
        FROM talent_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      
      if (!result.rows[0]) {
        log('info', 'タレントプロフィールが見つかりません', { userId });
        return null;
      }
      
      const profileResult = result.rows[0];
      
      // 生年月日情報をログ出力して確認
      log('info', 'タレントプロフィール結合クエリ結果', { 
        userId,
        birth_date: profileResult.birth_date
      });

      const profileData: TalentProfileData = {
        last_name: profileResult.last_name || '',
        first_name: profileResult.first_name || '',
        last_name_kana: profileResult.last_name_kana || '',
        first_name_kana: profileResult.first_name_kana || '',
        location: profileResult.location || '',
        nearest_station: profileResult.nearest_station || '',
        available_ids: profileResult.available_ids || { types: [], others: [] },
        can_provide_residence_record: !!profileResult.can_provide_residence_record,
        can_provide_std_test: !!profileResult.can_provide_std_test,
        height: profileResult.height || 0,
        weight: profileResult.weight || 0,
        cup_size: profileResult.cup_size || 'A',
        bust: profileResult.bust || null,
        waist: profileResult.waist || null,
        hip: profileResult.hip || null,
        body_mark: profileResult.body_mark || { has_body_mark: false, details: '', others: [] },
        smoking: profileResult.smoking || {
          enabled: false,
          types: [],
          others: []
        },
        face_visibility: profileResult.face_visibility || "全隠し",
        has_esthe_experience: !!profileResult.has_esthe_experience,
        esthe_experience_period: profileResult.esthe_experience_period || '',
        esthe_options: profileResult.esthe_options || { available: [], ng_options: [] },
        current_stores: profileResult.current_stores || [],
        previous_stores: profileResult.previous_stores || [],
        self_introduction: profileResult.self_introduction || '',
        notes: profileResult.notes || '',
        preferred_locations: profileResult.preferred_locations || [],
        ng_locations: profileResult.ng_locations || [],
        can_photo_diary: !!profileResult.can_photo_diary,
        can_home_delivery: !!profileResult.can_home_delivery,
        ng_options: profileResult.ng_options || { common: [], others: [] },
        allergies: profileResult.allergies || { types: [], others: [], has_allergy: false },
        has_sns_account: !!profileResult.has_sns_account,
        sns_urls: profileResult.sns_urls || [],
        photo_diary_urls: profileResult.photo_diary_urls || [],
        photos: profileResult.photos || [],
        // ユーザーテーブルから取得した生年月日情報を追加
        birth_date: profileResult.birth_date || null,
        // 新規追加フィールドの取得
        hair_color: profileResult.hair_color || undefined,
        look_type: profileResult.look_type || undefined,
        tattoo_level: profileResult.tattoo_level || undefined,
        titles: profileResult.titles || []
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
          face_visibility: profileData.face_visibility,
          hair_color: profileData.hair_color,
          look_type: profileData.look_type
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
          // 新規追加フィールド
          hair_color: data.hair_color,
          look_type: data.look_type,
          tattoo_level: data.tattoo_level,
          titles: data.titles?.length || 0, // タイトル数のみログに記録
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
          // 新規追加フィールド
          hair_color: result.hair_color,
          look_type: result.look_type,
          tattoo_level: result.tattoo_level,
          titles: result.titles ? result.titles.length : 0, // タイトル数のみログに記録
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
        .select({
          id: store_profiles.id,
          user_id: store_profiles.user_id,
          business_name: store_profiles.business_name,
          location: store_profiles.location,
          service_type: store_profiles.service_type,
          catch_phrase: store_profiles.catch_phrase,
          description: store_profiles.description,
          benefits: store_profiles.benefits,
          minimum_guarantee: store_profiles.minimum_guarantee,
          maximum_guarantee: store_profiles.maximum_guarantee,
          status: store_profiles.status,
          created_at: store_profiles.created_at,
          updated_at: store_profiles.updated_at
        })
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
  
  // デザイン設定の取得
  async getDesignSettings(userId: number): Promise<any | null> {
    try {
      log('info', 'デザイン設定取得開始', { userId });
      
      const query = 'SELECT * FROM design_settings WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      
      if (!result.rows[0]) {
        log('info', 'デザイン設定が見つかりません。デフォルト設定を使用します', { userId });
        return null;
      }
      
      log('info', 'デザイン設定取得成功', { 
        userId,
        sectionsCount: result.rows[0].sections?.length || 0
      });
      
      return result.rows[0];
    } catch (error) {
      log('error', 'デザイン設定取得エラー', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return null;
    }
  }
  
  // デザイン設定の更新
  async updateDesignSettings(userId: number, data: any): Promise<any> {
    try {
      log('info', 'デザイン設定更新開始', { 
        userId,
        sectionsCount: data.sections?.length || 0
      });
      
      // 既存のデータがあるか確認
      const checkQuery = 'SELECT * FROM design_settings WHERE user_id = $1';
      const checkResult = await pool.query(checkQuery, [userId]);
      
      let result;
      
      if (checkResult.rows.length > 0) {
        // 更新
        const updateQuery = `
          UPDATE design_settings 
          SET 
            global_settings = $1,
            sections = $2,
            updated_at = $3
          WHERE user_id = $4
          RETURNING *
        `;
        
        result = await pool.query(updateQuery, [
          data.globalSettings,
          data.sections,
          new Date(),
          userId
        ]);
      } else {
        // 新規作成
        const insertQuery = `
          INSERT INTO design_settings (
            user_id, 
            global_settings, 
            sections, 
            created_at, 
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        result = await pool.query(insertQuery, [
          userId,
          data.globalSettings,
          data.sections,
          new Date(),
          new Date()
        ]);
      }
      
      log('info', 'デザイン設定更新成功', { 
        userId,
        success: !!result.rows[0],
        sectionsCount: result.rows[0]?.sections?.length || 0
      });
      
      return result.rows[0];
    } catch (error) {
      log('error', 'デザイン設定更新エラー', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();