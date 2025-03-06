import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const photoTags = [
  "現在の髪色",
  "タトゥー",
  "傷",
  "アトピー",
  "自撮り写真",
  "スタジオ写真（無加工）",
  "スタジオ写真（加工済み）"
] as const;

// bodyMarkSchema定義を更新
export const bodyMarkSchema = z.object({
  hasBodyMark: z.boolean().default(false),
  details: z.string().optional(),
});

// 既存のphotoSchemaを更新
export const photoSchema = z.object({
  id: z.string(),  // 固有のIDを追加
  url: z.string(),
  tag: z.enum(photoTags),
});

// type定義も更新
export type Photo = z.infer<typeof photoSchema>;

// photos配列のスキーマ定義も更新
export const photosArraySchema = z.array(photoSchema)
  .min(1, "少なくとも1枚の写真が必要です")
  .max(20, "写真は最大20枚までです")
  .refine(
    (photos) => photos.some((photo) => photo.tag === "現在の髪色"),
    "現在の髪色の写真は必須です"
  );

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

// 出稼ぎ/在籍の選択肢
export const workTypes = ["出稼ぎ", "在籍"] as const;
export type WorkType = typeof workTypes[number];

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
  birthDate: date("birth_date").notNull(),
  birthDateModified: boolean("birth_date_modified").default(false),
  preferredLocations: jsonb("preferred_locations").$type<string[]>().default([]),
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
  availableIds: jsonb("available_ids").$type<{
    types: IdType[];
    others: string[];
  }>().default({ types: [], others: [] }).notNull(),
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
  ngOptions: jsonb("ng_options").$type<{
    common: CommonNgOption[];
    others: string[];
  }>().default({ common: [], others: [] }).notNull(),
  allergies: jsonb("allergies").$type<{
    types: AllergyType[];
    others: string[];
    hasAllergy: boolean;
  }>().default({ types: [], others: [], hasAllergy: false }).notNull(),
  smoking: jsonb("smoking").$type<{
    enabled: boolean;
    types: SmokingType[];
    others: string[];
  }>().default({ enabled: false, types: [], others: [] }).notNull(),
  hasSnsAccount: boolean("has_sns_account").default(false),
  snsUrls: jsonb("sns_urls").$type<string[]>().default([]).notNull(),
  currentStores: jsonb("current_stores").$type<{
    storeName: string;
    stageName: string;
  }[]>().default([]).notNull(),
  previousStores: jsonb("previous_stores").$type<{
    storeName: string;
  }[]>().default([]).notNull(),
  photoDiaryUrls: jsonb("photo_diary_urls").$type<string[]>().default([]).notNull(),
  selfIntroduction: text("self_introduction"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  estheOptions: jsonb("esthe_options").$type<{
    available: EstheOption[];
    ngOptions: string[];
  }>().default({ available: [], ngOptions: [] }).notNull(),
  hasEstheExperience: boolean("has_esthe_experience").default(false),
  estheExperiencePeriod: text("esthe_experience_period"),
  workType: text("work_type", { enum: workTypes }),
  workPeriodStart: date("work_period_start"),
  workPeriodEnd: date("work_period_end"),
  canArrivePreviousDay: boolean("can_arrive_previous_day").default(false),
  desiredGuarantee: integer("desired_guarantee"),
  desiredRate: integer("desired_rate"),
  waitingHours: integer("waiting_hours"),
  departureLocation: text("departure_location", { enum: prefectures }),
  returnLocation: text("return_location", { enum: prefectures }),
  preferredLocations: jsonb("preferred_locations").$type<Prefecture[]>().default([]).notNull(),
  ngLocations: jsonb("ng_locations").$type<Prefecture[]>().default([]).notNull(),
  bodyMark: jsonb("body_mark").$type<BodyMark>().default({ hasBodyMark: false, details: "" }).notNull(),
  photos: jsonb("photos").$type<Photo[]>().default([]).notNull(),
  age: integer("age"),
});

// Login and registration schemas
export const loginSchema = z.object({
  username: z.string().min(1, "ニックネームを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  role: z.enum(["talent", "store"]),
});

export const baseUserSchema = createInsertSchema(users).omit({ id: true });

// Talent profile schema
export const talentProfileSchema = z.object({
  // 必須フィールド
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

  // オプショナルフィールド
  availableIds: z.object({
    types: z.array(z.enum(idTypes)).min(1, "身分証明書を1つ以上選択してください"),
    others: z.array(z.string()).default([]),
  }).default({ types: [], others: [] }),

  canProvideResidenceRecord: z.boolean().default(false),
  height: z.number(),
  weight: z.number(),
  cupSize: z.enum(cupSizes, {
    required_error: "カップサイズを選択してください",
  }),

  bust: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === "" || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }),
  waist: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === "" || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }),
  hip: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === "" || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }),

  faceVisibility: z.enum(faceVisibilityTypes, {
    required_error: "パネルの顔出し設定を選択してください",
  }),

  canPhotoDiary: z.boolean().default(false),
  canHomeDelivery: z.boolean().default(false),
  hasSnsAccount: z.boolean().default(false),
  hasEstheExperience: z.boolean().default(false),

  ngOptions: z.object({
    common: z.array(z.enum(commonNgOptions)).default([]),
    others: z.array(z.string()).default([]),
  }).default({ common: [], others: [] }),

  allergies: z.object({
    types: z.array(z.enum(allergyTypes)).default([]),
    others: z.array(z.string()).default([]),
    hasAllergy: z.boolean().default(false),
  }).default({ types: [], others: [], hasAllergy: false }),

  smoking: z.object({
    enabled: z.boolean().default(false),
    types: z.array(z.enum(smokingTypes)).default([]),
    others: z.array(z.string()).default([]),
  }).default({ enabled: false, types: [], others: [] }),

  snsUrls: z.array(z.string()).default([]),
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })).default([]),
  previousStores: z.array(z.object({
    storeName: z.string(),
  })).default([]),
  photoDiaryUrls: z.array(z.string()).default([]),

  // photosフィールドを更新
  photos: photosArraySchema,

  bodyMark: bodyMarkSchema.default({
    hasBodyMark: false,
    details: "",
  }),

  selfIntroduction: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  estheExperiencePeriod: z.string().optional().default(""),

  estheOptions: z.object({
    available: z.array(z.enum(estheOptions)).default([]),
    ngOptions: z.array(z.string()).default([]),
  }).default({ available: [], ngOptions: [] }),

  // 求人関連フィールドをオプショナルに変更
  workType: z.enum(workTypes).optional(),
  workPeriodStart: z.string().optional(),
  workPeriodEnd: z.string().optional(),
  canArrivePreviousDay: z.boolean().default(false),
  desiredGuarantee: z.number().optional(),
  desiredRate: z.number().optional(),
  waitingHours: z.number().optional(),
  departureLocation: z.enum(prefectures).optional(),
  returnLocation: z.enum(prefectures).optional(),
  preferredLocations: z.array(z.enum(prefectures)).default([]),
  ngLocations: z.array(z.enum(prefectures)).default([]),
}).strict();

// スキーマ定義の最後に追加
export const talentProfileUpdateSchema = talentProfileSchema.extend({
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return val.length >= 8 && val.length <= 48 && /^(?=.*[a-z])(?=.*[0-9])[a-zA-Z0-9!#$%\(\)\+,\-\./:=?@\[\]\^_`\{\|\}]*$/.test(val);
      },
      {
        message: "パスワードは8文字以上48文字以内で、半角英字小文字、半角数字をそれぞれ1種類以上含める必要があります"
      }
    ),
}).omit({
  id: true,
  userId: true,
  updatedAt: true,
  age: true
});


// 型定義エクスポートを追加
export type BodyMark = z.infer<typeof bodyMarkSchema>;
export type TalentProfileUpdate = z.infer<typeof talentProfileUpdateSchema>;

// Export types
export type User = typeof users.$inferSelect;
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
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

// Updated SelectUser type definition
export type SelectUser = {
  id: number;
  username: string;
  role: "talent" | "store";
  displayName: string;
  location: string;
  birthDate: string;
  birthDateModified: boolean;
  preferredLocations: string[];
  createdAt: Date;
};

export type InsertTalentProfile = typeof talentProfiles.$inferInsert;
export type TalentProfileData = z.infer<typeof talentProfileSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof talentRegisterFormSchema>;

export type PreviousStore = {
  storeName: string;
};