import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 都道府県の列挙型
export const prefectures = [
  "北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県",
  "群馬県", "栃木県", "茨城県", "東京都", "神奈川県", "千葉県", "埼玉県",
  "愛知県", "静岡県", "三重県", "岐阜県", "石川県", "福井県", "富山県",
  "新潟県", "長野県", "山梨県", "大阪府", "兵庫県", "京都府", "滋賀県",
  "奈良県", "和歌山県", "広島県", "岡山県", "山口県", "鳥取県", "島根県",
  "香川県", "徳島県", "高知県", "愛媛県", "福岡県", "長崎県", "大分県",
  "佐賀県", "熊本県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

// 体型の列挙型
export const bodyTypes = [
  "スリム", "普通", "グラマー", "ぽっちゃり"
] as const;

// カップサイズの列挙型
export const cupSizes = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"
] as const;

// 写真タグの列挙型
export const photoTags = [
  "現在の髪色", "宣材写真", "タトゥー", "傷", "矯正", "やけど",
  "ピアス", "妊娠線", "手術痕", "その他"
] as const;

// 顔出し設定の列挙型
export const faceVisibilityTypes = [
  "全出し", "口だけ隠し", "目だけ隠し", "全隠し"
] as const;

// 身分証明書の種類
export const idTypes = [
  "運転免許証", "パスポート", "マイナンバーカード", "住基カード"
] as const;

// アレルギーの種類
export const allergyTypes = [
  "犬", "猫", "鳥", "その他"
] as const;

// 喫煙の種類
export const smokingTypes = [
  "紙タバコ", "電子タバコ", "その他"
] as const;

// NGオプションの列挙型
export const commonNgOptions = [
  "AF", "聖水", "即尺", "即尺(事前に洗い済み)",
  "撮影顔出し", "撮影顔無し"
] as const;

// エステオプションの列挙型
export const estheOptions = [
  "ホイップ", "マッサージジェル", "極液", "ベビードール",
  "マイクロビキニ", "ブラなしベビードール", "トップレス",
  "フルヌード", "ノンショーツ", "deepリンパ", "ハンドでの抜き",
  "キス", "フェラ", "スキン着用フェラ"
] as const;

// 希望業種の列挙型
export const serviceTypes = [
  "deriheru", "hoteheru", "hakoheru", "esthe", "onakura", "mseikan"
] as const;

export type Prefecture = typeof prefectures[number];
export type BodyType = typeof bodyTypes[number];
export type CupSize = typeof cupSizes[number];
export type PhotoTag = typeof photoTags[number];
export type FaceVisibility = typeof faceVisibilityTypes[number];
export type IdType = typeof idTypes[number];
export type AllergyType = typeof allergyTypes[number];
export type SmokingType = typeof smokingTypes[number];
export type CommonNgOption = typeof commonNgOptions[number];
export type EstheOption = typeof estheOptions[number];
export type ServiceType = typeof serviceTypes[number];

// ユーザーテーブル（既存）を拡張
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["talent", "store"] }).notNull(),
  displayName: text("display_name").notNull(),
  age: integer("age"),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  birthDate: date("birth_date"),
  preferredLocations: json("preferred_locations").$type<Prefecture[]>().default([]),
});

// タレントプロフィールテーブル
export const talentProfiles = pgTable("talent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),

  // 基本情報
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  lastNameKana: text("last_name_kana").notNull(),
  firstNameKana: text("first_name_kana").notNull(),

  // 身体的特徴
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  bust: integer("bust"),
  waist: integer("waist"),
  hip: integer("hip"),
  cupSize: text("cup_size", { enum: cupSizes }),
  bodyType: text("body_type", { enum: bodyTypes }),

  // 写真管理
  photoUrls: json("photo_urls").$type<{
    urls: string[];
    tags: Record<string, PhotoTag[]>;
  }>().default({ urls: [], tags: {} }),

  // パネル設定
  faceVisibility: text("face_visibility", { enum: faceVisibilityTypes }).notNull(),

  // 身分証明書
  hasResidenceCard: boolean("has_residence_card").default(false),
  availableIds: json("available_ids").$type<IdType[]>().default([]),

  // 希望・NG条件
  ngAreas: json("ng_areas").$type<Prefecture[]>().default([]),
  preferredAreas: json("preferred_areas").$type<Prefecture[]>().default([]),
  residence: text("residence").notNull(),

  // 健康・生活
  smoking: boolean("smoking").default(false),
  smokingTypes: json("smoking_types").$type<SmokingType[]>().default([]),
  tattoo: boolean("tattoo").default(false),
  piercing: boolean("piercing").default(false),
  allergies: json("allergies").$type<{
    types: AllergyType[];
    others: string[];
  }>().default({ types: [], others: [] }),

  // SNS・写メ日記
  canPhotoDiary: boolean("can_photo_diary").default(false),
  hasSnsAccount: boolean("has_sns_account").default(false),
  snsUrls: json("sns_urls").$type<string[]>().default([]),

  // 在籍情報
  hasCurrentStore: boolean("has_current_store").default(false),
  currentStores: json("current_stores").$type<{
    storeName: string;
    stageName: string;
    photoDiaryUrl?: string;
  }[]>().default([]),

  // サービス
  serviceTypes: json("service_types").$type<ServiceType[]>().default([]),
  canHomeDelivery: boolean("can_home_delivery").default(false),
  canForeign: boolean("can_foreign").default(false),
  canNonJapanese: boolean("can_non_japanese").default(false),

  // NGオプション
  ngOptions: json("ng_options").$type<{
    common: CommonNgOption[];
    others: string[];
  }>().default({ common: [], others: [] }),

  // エステ専用オプション
  estheOptions: json("esthe_options").$type<{
    available: EstheOption[];
    ngOptions: string[];
    hasExperience: boolean;
    experienceMonths?: number;
  }>().default({ available: [], ngOptions: [], hasExperience: false }),

  // 経験
  previousStores: json("previous_stores").$type<{
    storeName: string;
    period?: string;
  }[]>().default([]),

  // PR・備考
  selfIntroduction: text("self_introduction"),
  notes: text("notes"),

  updatedAt: timestamp("updated_at").defaultNow(),
});

// バリデーションスキーマ
export const talentProfileUpdateSchema = z.object({
  lastName: z.string().min(1, "姓を入力してください"),
  firstName: z.string().min(1, "名を入力してください"),
  lastNameKana: z.string().min(1, "姓（カナ）を入力してください"),
  firstNameKana: z.string().min(1, "名（カナ）を入力してください"),

  birthDate: z.string().min(1, "生年月日を入力してください"),
  age: z.string(),

  height: z.number().min(140, "身長を正しく入力してください"),
  weight: z.number().min(30, "体重を正しく入力してください"),
  bust: z.number().optional(),
  waist: z.number().optional(),
  hip: z.number().optional(),
  cupSize: z.enum(cupSizes),
  bodyType: z.enum(bodyTypes),

  photoUrls: z.object({
    urls: z.array(z.string()),
    tags: z.record(z.array(z.enum(photoTags))),
  }),

  faceVisibility: z.enum(faceVisibilityTypes),
  hasResidenceCard: z.boolean(),
  availableIds: z.array(z.enum(idTypes)),

  ngAreas: z.array(z.enum(prefectures)),
  preferredAreas: z.array(z.enum(prefectures)),
  residence: z.string().min(1, "居住地を入力してください"),

  smoking: z.boolean(),
  smokingTypes: z.array(z.enum(smokingTypes)).optional(),
  tattoo: z.boolean(),
  piercing: z.boolean(),
  allergies: z.object({
    types: z.array(z.enum(allergyTypes)),
    others: z.array(z.string()),
  }),

  canPhotoDiary: z.boolean(),
  hasSnsAccount: z.boolean(),
  snsUrls: z.array(z.string()).optional(),

  hasCurrentStore: z.boolean(),
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
    photoDiaryUrl: z.string().optional(),
  })).optional(),

  serviceTypes: z.array(z.enum(serviceTypes)).min(1, "希望業種を1つ以上選択してください"),
  canHomeDelivery: z.boolean(),
  canForeign: z.boolean(),
  canNonJapanese: z.boolean().optional(),

  ngOptions: z.object({
    common: z.array(z.enum(commonNgOptions)),
    others: z.array(z.string()),
  }),

  estheOptions: z.object({
    available: z.array(z.enum(estheOptions)),
    ngOptions: z.array(z.string()),
    hasExperience: z.boolean(),
    experienceMonths: z.number().optional(),
  }).optional(),

  previousStores: z.array(z.object({
    storeName: z.string(),
    period: z.string().optional(),
  })),

  selfIntroduction: z.string().max(1000, "自己PRは1000文字以内で入力してください"),
  notes: z.string().optional(),
});

// フォーム用の拡張スキーマ（パスワード確認と同意チェックを含む）
export const talentRegisterFormSchema = talentProfileUpdateSchema.extend({
  passwordConfirm: z.string(),
  privacyPolicy: z.boolean()
}).refine((data) => data.privacyPolicy === true, {
  message: "個人情報の取り扱いについて同意が必要です",
  path: ["privacyPolicy"],
}).refine((data) => {
  try {
    const birth = new Date(data.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  } catch (e) {
    return false;
  }
}, {
  message: "18歳未満の方は登録できません",
  path: ["birthDate"],
});

// 型定義のエクスポート
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type InsertTalentProfile = z.infer<typeof talentProfileUpdateSchema>;
export type InsertTalentRegisterForm = z.infer<typeof talentRegisterFormSchema>;


// 基本スキーマを作成
const baseUserSchema = createInsertSchema(users).omit({ id: true, age: true });

// API用のinsertスキーマ
export const insertUserSchema = baseUserSchema.extend({
  role: z.literal("talent"),
  username: z.string()
    .min(1, "ニックネームを入力してください")
    .max(10, "ニックネームは10文字以内で入力してください")
    .regex(/^[a-zA-Z0-9ぁ-んァ-ン一-龥]*$/, "使用できない文字が含まれています"),
  password: z.string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(48, "パスワードは48文字以内で入力してください")
    .regex(/^(?=.*[a-z])(?=.*[0-9])[a-zA-Z0-9!#$%\(\)\+,\-\./:=?@\[\]\^_`\{\|\}]*$/,
      "半角英字小文字、半角数字をそれぞれ1種類以上含める必要があります"),
  displayName: z.string().min(1, "お名前を入力してください"),
  location: z.enum(prefectures, {
    errorMap: () => ({ message: "在住地を選択してください" })
  }),
  preferredLocations: z.array(z.enum(prefectures)).min(1, "働きたい地域を選択してください"),
});

// 応募履歴テーブル
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "rejected", "withdrawn"]
  }).notNull(),
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  message: text("message"),
  desiredStartDate: date("desired_start_date"),
  desiredDuration: text("desired_duration"),
});

// 閲覧履歴テーブル
export const viewHistory = pgTable("view_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// キープリストテーブル
export const keepList = pgTable("keep_list", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  note: text("note"),
});

// スキーマ定義（既存）
export const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  role: z.enum(["talent", "store"]),
});

// 応募作成スキーマ
export const createApplicationSchema = z.object({
  storeId: z.number(),
  message: z.string().optional(),
  desiredStartDate: z.string(),
  desiredDuration: z.string(),
});