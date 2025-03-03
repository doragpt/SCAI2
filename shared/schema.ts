import { pgTable, text, serial, integer, boolean, timestamp, date, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const prefectures = [
  "北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県",
  "群馬県", "栃木県", "茨城県", "東京都", "神奈川県", "千葉県", "埼玉県",
  "愛知県", "静岡県", "三重県", "岐阜県", "石川県", "福井県", "富山県",
  "新潟県", "長野県", "山梨県", "大阪府", "兵庫県", "京都府", "滋賀県",
  "奈良県", "和歌山県", "広島県", "岡山県", "山口県", "鳥取県", "島根県",
  "香川県", "徳島県", "高知県", "愛媛県", "福岡県", "長崎県", "大分県",
  "佐賀県", "熊本県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

export const bodyTypes = ["スリム", "普通", "グラマー", "ぽっちゃり"] as const;
export const cupSizes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"] as const;
export const photoTags = [
  "現在の髪色",
  "宣材写真",
  "タトゥー",
  "傷",
  "矯正",
  "やけど",
  "ピアス",
  "妊娠線",
  "手術痕",
  "その他"
] as const;

export const faceVisibilityTypes = ["全出し", "口だけ隠し", "目だけ隠し", "全隠し"] as const;
export const idTypes = [
  "運転免許証",
  "マイナンバーカード",
  "パスポート",
  "写真付き住民基本台帳カード",
  "在留カードまたは特別永住者証明書",
  "健康保険証",
  "卒業アルバム"
] as const;

export const allergyTypes = ["犬", "猫", "鳥"] as const;
export const smokingTypes = ["紙タバコ", "電子タバコ"] as const;

export const commonNgOptions = [
  "AF",
  "聖水",
  "即尺",
  "即尺(事前に洗い済み)",
  "撮影顔出し",
  "撮影顔無し"
] as const;

// エステオプションの配列定義を修正
export const estheOptions = [
  "ホイップ",
  "マッサージジェル",
  "極液",
  "ベビードール",
  "マイクロビキニ",
  "ブラなしベビードール",
  "トップレス",
  "フルヌード",
  "ノンショーツ",
  "deepリンパ",
  "ハンド抜き",
  "キス",
  "フェラ",
  "スキンフェラ"
] as const;

export const serviceTypes = [
  "deriheru",
  "hoteheru",
  "hakoheru",
  "esthe",
  "onakura",
  "mseikan"
] as const;

// Type definitions
export type Prefecture = typeof prefectures[number];
export type BodyType = typeof bodyTypes[number];
export type CupSize = typeof cupSizes[number];
export type PhotoTag = typeof photoTags[number];
export type FaceVisibility = typeof faceVisibilityTypes[number];
export type IdType = typeof idTypes[number];
export type AllergyType = typeof allergyTypes[number];
export type SmokingType = typeof smokingTypes[number];
export type CommonNgOption = typeof commonNgOptions[number];
// 型定義を更新
export type EstheOption = typeof estheOptions[number];
export type ServiceType = typeof serviceTypes[number];

// Database tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["talent", "store"] }).notNull(),
  displayName: text("display_name").notNull(),
  location: text("location", { enum: prefectures }).notNull(),
  birthDate: date("birth_date"),
  preferredLocations: json("preferred_locations").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Talent profiles table
export const talentProfiles = pgTable("talent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  lastNameKana: text("last_name_kana").notNull(),
  firstNameKana: text("first_name_kana").notNull(),
  location: text("location", { enum: prefectures }).notNull(),
  nearestStation: text("nearest_station").notNull(),
  availableIds: json("available_ids").$type<{
    types: IdType[];
    others: string[];
  }>().default({ types: [], others: [] }),
  canProvideResidenceRecord: boolean("can_provide_residence_record").default(false),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  cupSize: text("cup_size", { enum: cupSizes }).notNull(),
  bust: integer("bust"),
  waist: integer("waist"),
  hip: integer("hip"),
  faceVisibility: text("face_visibility", { enum: faceVisibilityTypes }).notNull(),
  canPhotoDiary: boolean("can_photo_diary").default(false),
  canHomeDelivery: boolean("can_home_delivery").default(false),
  ngOptions: json("ng_options").$type<{
    common: CommonNgOption[];
    others: string[];
  }>().default({ common: [], others: [] }),
  allergies: json("allergies").$type<{
    types: AllergyType[];
    others: string[];
    hasAllergy: boolean;
  }>().default({ types: [], others: [], hasAllergy: false }),
  smoking: json("smoking").$type<{
    enabled: boolean;
    types: SmokingType[];
    others: string[];
  }>().default({ enabled: false, types: [], others: [] }),
  hasSnsAccount: boolean("has_sns_account").default(false),
  snsUrls: json("sns_urls").$type<string[]>().default([]),
  currentStores: json("current_stores").$type<{
    storeName: string;
    stageName: string;
  }[]>().default([]),
  previousStores: json("previous_stores").$type<{
    storeName: string;
  }[]>().default([]),
  photoDiaryUrls: json("photo_diary_urls").$type<string[]>().default([]),
  selfIntroduction: text("self_introduction"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  estheOptions: json("esthe_options").$type<{
    available: EstheOption[];
    ngOptions: string[];
  }>().default({ available: [], ngOptions: [] }),
  hasEstheExperience: boolean("has_esthe_experience").default(false),
  estheExperiencePeriod: text("esthe_experience_period"),
});

// Login and registration schemas
export const loginSchema = z.object({
  username: z.string().min(1, "ニックネームを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  role: z.enum(["talent", "store"]),
});

export const baseUserSchema = createInsertSchema(users).omit({ id: true });

export const talentRegisterFormSchema = z.object({
  username: z.string()
    .min(1, "ニックネームを入力してください")
    .max(10, "ニックネームは10文字以内で入力してください")
    .regex(/^[a-zA-Z0-9ぁ-んァ-ン一-龥]*$/, "使用できない文字が含まれています"),
  password: z.string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(48, "パスワードは48文字以内で入力してください")
    .regex(
      /^(?=.*[a-z])(?=.*[0-9])[a-zA-Z0-9!#$%\(\)\+,\-\./:=?@\[\]\^_`\{\|\}]*$/,
      "半角英字小文字、半角数字をそれぞれ1種類以上含める必要があります"
    ),
  passwordConfirm: z.string(),
  displayName: z.string().min(1, "お名前を入力してください"),
  birthDate: z.string().min(1, "生年月日を入力してください"),
  location: z.enum(prefectures, {
    errorMap: () => ({ message: "在住地を選択してください" })
  }),
  preferredLocations: z.array(z.enum(prefectures)).min(1, "働きたい地域を選択してください"),
  role: z.literal("talent"),
  privacyPolicy: z.boolean()
}).refine((data) => data.privacyPolicy === true, {
  message: "個人情報の取り扱いについて同意が必要です",
  path: ["privacyPolicy"],
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードが一致しません",
  path: ["passwordConfirm"],
});

// Talent profile schema
// スキーマの更新
export const talentProfileSchema = z.object({
  lastName: z.string().min(1, "姓を入力してください"),
  firstName: z.string().min(1, "名を入力してください"),
  lastNameKana: z.string()
    .min(1, "姓（カナ）を入力してください")
    .regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  firstNameKana: z.string()
    .min(1, "名（カナ）を入力してください")
    .regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  location: z.enum(prefectures, {
    required_error: "都道府県を選択してください",
  }),
  nearestStation: z.string().min(1, "最寄り駅を入力してください"),
  availableIds: z.object({
    types: z.array(z.enum(idTypes)).min(1, "身分証明書を1つ以上選択してください"),
    others: z.array(z.string()),
  }),
  canProvideResidenceRecord: z.boolean(),
  height: z.number()
    .min(130, "身長は130cm以上で入力してください")
    .max(190, "身長は190cm以下で入力してください"),
  weight: z.number()
    .min(30, "体重は30kg以上で入力してください")
    .max(150, "体重は150kg以下で入力してください"),
  cupSize: z.enum(cupSizes, {
    required_error: "カップサイズを選択してください",
  }),
  bust: z.number().optional(),
  waist: z.number().optional(),
  hip: z.number().optional(),
  faceVisibility: z.enum(faceVisibilityTypes, {
    required_error: "パネルの顔出し設定を選択してください",
  }),
  canPhotoDiary: z.boolean(),
  canHomeDelivery: z.boolean(),
  ngOptions: z.object({
    common: z.array(z.enum(commonNgOptions)),
    others: z.array(z.string()),
  }).optional(),
  allergies: z.object({
    types: z.array(z.enum(allergyTypes)),
    others: z.array(z.string()),
    hasAllergy: z.boolean(),
  }),
  smoking: z.object({
    enabled: z.boolean(),
    types: z.array(z.enum(smokingTypes)),
    others: z.array(z.string()),
  }),
  hasSnsAccount: z.boolean(),
  snsUrls: z.array(z.string()),
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })),
  previousStores: z.array(z.object({
    storeName: z.string(),
  })),
  photoDiaryUrls: z.array(z.string()),
  selfIntroduction: z.string().optional(),
  notes: z.string().optional(),
  estheOptions: z.object({
    available: z.array(z.enum(estheOptions)),
    ngOptions: z.array(z.string()),
  }).optional(),
  hasEstheExperience: z.boolean().optional(),
  estheExperiencePeriod: z.string().optional(),
});

// Export types
export type User = typeof users.$inferSelect;
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertTalentProfile = typeof talentProfiles.$inferInsert;
export type TalentProfileData = z.infer<typeof talentProfileSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof talentRegisterFormSchema>;