import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
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
  "ハンドでの抜き",
  "キス",
  "フェラ",
  "スキン着用フェラ"
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

export const talentProfiles = pgTable("talent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),

  // 基本情報
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
    hasCurrent: boolean; // 現在の髪色写真があるかどうか
  }>().default({ urls: [], tags: {}, hasCurrent: false }),

  // パネル設定
  faceVisibility: text("face_visibility", { enum: faceVisibilityTypes }).notNull(),
  canPhotoDiary: boolean("can_photo_diary").default(false),
  photoDiaryUrls: json("photo_diary_urls").$type<string[]>().default([]),

  // 身分証明書
  availableIds: json("available_ids").$type<{
    types: IdType[];
    others: string[];
  }>().default({ types: [], others: [] }),

  // SNS
  hasSnsAccount: boolean("has_sns_account").default(false),
  snsUrls: json("sns_urls").$type<string[]>().default([]),

  // 在籍情報
  currentStores: json("current_stores").$type<{
    storeName: string;
    stageName: string;
  }[]>().default([]),

  // 健康・生活
  allergies: json("allergies").$type<{
    types: AllergyType[];
    others: string[];
    hasAllergy: boolean;
  }>().default({ types: [], others: [], hasAllergy: false }),

  smoking: boolean("smoking").default(false),
  smokingTypes: json("smoking_types").$type<{
    types: SmokingType[];
    others: string[];
  }>().default({ types: [], others: [] }),

  // サービス
  serviceTypes: json("service_types").$type<ServiceType[]>().default([]),
  canSelfDispatch: boolean("can_self_dispatch").default(false),

  // NGオプション
  ngOptions: json("ng_options").$type<{
    common: CommonNgOption[];
    others: string[];
  }>().default({ common: [], others: [] }),

  // エステオプション
  estheOptions: json("esthe_options").$type<{
    available: EstheOption[];
    ngOptions: string[];
  }>().default({ available: [], ngOptions: [] }),

  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schema definitions
export const baseUserSchema = createInsertSchema(users).omit({ id: true });

// タレントプロフィールスキーマ
export const talentProfileSchema = z.object({
  height: z.number()
    .min(130, "身長は130cm以上で入力してください")
    .max(190, "身長は190cm以下で入力してください"),
  weight: z.number()
    .min(30, "体重は30kg以上で入力してください")
    .max(150, "体重は150kg以下で入力してください"),
  bust: z.number().optional(),
  waist: z.number().optional(),
  hip: z.number().optional(),
  cupSize: z.enum(cupSizes).optional(),
  bodyType: z.enum(bodyTypes),

  photoUrls: z.object({
    urls: z.array(z.string()),
    tags: z.record(z.array(z.enum(photoTags))),
    hasCurrent: z.boolean(),
  }).refine((data) => data.urls.length > 0 && data.tags["現在の髪色"]?.length > 0, {
    message: "現在の髪色の写真を1枚以上選択してください",
  }),

  faceVisibility: z.enum(faceVisibilityTypes),
  canPhotoDiary: z.boolean(),
  photoDiaryUrls: z.array(z.string()),

  availableIds: z.object({
    types: z.array(z.enum(idTypes)),
    others: z.array(z.string()),
  }),

  hasSnsAccount: z.boolean(),
  snsUrls: z.array(z.string()),

  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })),

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

  serviceTypes: z.array(z.enum(serviceTypes)),
  canSelfDispatch: z.boolean(),

  ngOptions: z.object({
    common: z.array(z.enum(commonNgOptions)),
    others: z.array(z.string()),
  }),

  estheOptions: z.object({
    available: z.array(z.enum(estheOptions)),
    ngOptions: z.array(z.string()),
  }),
});

// Export types
export type User = typeof users.$inferSelect;
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertTalentProfile = typeof talentProfiles.$inferInsert;
export type TalentProfileData = z.infer<typeof talentProfileSchema>;