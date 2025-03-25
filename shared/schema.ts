import { pgTable, text, serial, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Constants
export const prefectures = [
  "北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県",
  "群馬県", "栃木県", "茨城県", "東京都", "神奈川県", "千葉県", "埼玉県",
  "愛知県", "静岡県", "三重県", "岐阜県", "石川県", "福井県", "富山県",
  "新潟県", "長野県", "山梨県", "大阪府", "兵庫県", "京都府", "滋賀県",
  "奈良県", "和歌山県", "広島県", "岡山県", "山口県", "鳥取県", "島根県",
  "香川県", "徳島県", "高知県", "愛媛県", "福岡県", "長崎県", "大分県",
  "佐賀県", "熊本県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

// ServiceType関連の定義
export const serviceTypes = [
  "デリヘル",
  "ホテヘル",
  "箱ヘル",
  "エステ",
  "オナクラ",
  "メンズエステ"
] as const;

export const cupSizes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"] as const;
export const photoTags = [
  "現在の髪色",
  "タトゥー",
  "傷",
  "アトピー",
  "自撮り写真",
  "スタジオ写真（無加工）",
  "スタジオ写真（加工済み）"
] as const;

// 体型定義
export const bodyTypes = ["スリム", "普通", "グラマー", "ぽっちゃり"] as const;

// 体型系統（スペック基準）
export const bodyTypesBySpec = [
  { name: "スレンダー", minSpec: 110 },
  { name: "やや細め", minSpec: 105, maxSpec: 109 },
  { name: "普通", minSpec: 100, maxSpec: 104 },
  { name: "ややぽっちゃり", minSpec: 95, maxSpec: 99 },
  { name: "ぽっちゃり", minSpec: 90, maxSpec: 94 },
  { name: "太め", maxSpec: 89 }
] as const;

// タトゥー・傷の許容レベル
export const tattooAcceptanceLevels = [
  "完全に許容不可", // タトゥー/傷のある人材は受け入れない
  "小さいもののみ許容", // 小さいタトゥー/傷なら受け入れる
  "目立たない場所のみ許容", // 服で隠れる場所にあるタトゥー/傷なら受け入れる
  "すべて許容", // サイズや場所に関わらず受け入れる
  "応相談" // ルックスやスキルによって個別判断する
] as const;

// 髪色系統
export const hairColorTypes = [
  "黒髪",
  "暗めの茶髪",
  "明るめの茶髪", 
  "金髪・インナーカラー・派手髪"
] as const;

// ルックス系統
export const lookTypes = [
  "ロリ系・素人系・素朴系・可愛い系",
  "清楚系",
  "綺麗系・キレカワ系・モデル系・お姉さん系",
  "キャバ系・ギャル系",
  "若妻系", // 20代後半〜30代前半
  "人妻系", // 30代〜
  "熟女系", // 40代〜
  "ぽっちゃり系"
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
export const workTypes = ["出稼ぎ", "在籍"] as const;
export const jobStatusTypes = ["draft", "published", "closed"] as const;

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
  "ハンド抜き",
  "キス",
  "フェラ",
  "スキンフェラ"
] as const;

// 各カテゴリーごとの定数として定義
const interviewBenefits = [
  "見学だけでもOK",
  "体験入店OK",
  "店外面接OK",
  "面接交通費支給",
  "友達と面接OK",
  "オンライン面接OK",
  "写メ面接OK",
  "即日勤務OK",
  "入店特典あり"
] as const;

const workStyleBenefits = [
  "自由出勤OK",
  "週1日〜OK",
  "週3日以上歓迎",
  "週5日以上歓迎",
  "土日だけOK",
  "1日3時間〜OK",
  "短期OK",
  "長期休暇OK",
  "掛け持ちOK"
] as const;

const salaryBenefits = [
  "日給2万円以上",
  "日給3万円以上",
  "日給4万円以上",
  "日給5万円以上",
  "日給6万円以上",
  "日給7万円以上",
] as const;

const bonusBenefits = [
  "バック率50%以上",
  "バック率60%以上",
  "バック率70%以上",
  "完全日払いOK",
  "保証制度あり",
  "指名バックあり",
  "オプションバックあり",
  "ボーナスあり"
] as const;

const facilityBenefits = [
  "送迎あり",
  "駅チカ",
  "駐車場完備",
  "個室待機",
  "アリバイ対策OK",
  "寮完備",
  "託児所あり",
  "制服貸与",
  "食事支給"
] as const;

const requirementsBenefits = [
  "未経験大歓迎",
  "経験者優遇",
  "主婦・人妻歓迎",
  "学生さん歓迎",
  "20代活躍中",
  "30代活躍中",
  "40代以上歓迎",
  "スリム体型",
  "グラマー体型",
  "tattoo(小)OK"
] as const;

// benefitTypesオブジェクトを作成
export const benefitTypes = {
  interview: interviewBenefits,
  workStyle: workStyleBenefits,
  salary: salaryBenefits,
  bonus: bonusBenefits,
  facility: facilityBenefits,
  requirements: requirementsBenefits,
} as const;

// フラットな待遇リストの生成
export const allBenefitTypes = [
  ...interviewBenefits,
  ...workStyleBenefits,
  ...salaryBenefits,
  ...bonusBenefits,
  ...facilityBenefits,
  ...requirementsBenefits,
] as const;

// 待遇のカテゴリー定義
export const benefitCategories = {
  interview: "面接・入店前",
  workStyle: "働き方自由",
  salary: "お給料目安",
  bonus: "お給料+α",
  facility: "お店の環境",
  requirements: "採用について"
} as const;

// Type definitions
export type Prefecture = typeof prefectures[number];
export type ServiceType = typeof serviceTypes[number];
export type PhotoTag = typeof photoTags[number];
export type BodyType = typeof bodyTypes[number];
export type BodyTypeBySpec = typeof bodyTypesBySpec[number];
export type TattooAcceptanceLevel = typeof tattooAcceptanceLevels[number];
export type HairColorType = typeof hairColorTypes[number];
export type LookType = typeof lookTypes[number];
export type CupSize = typeof cupSizes[number];
export type FaceVisibility = typeof faceVisibilityTypes[number];
export type IdType = typeof idTypes[number];
export type AllergyType = typeof allergyTypes[number];
export type SmokingType = typeof smokingTypes[number];
export type CommonNgOption = typeof commonNgOptions[number];
export type EstheOption = typeof estheOptions[number];
export type WorkType = typeof workTypes[number];
export type JobStatus = typeof jobStatusTypes[number];
export type BenefitType = typeof allBenefitTypes[number];
export type BenefitCategory = keyof typeof benefitTypes;

// カスタムオファー用の型定義
export const specialOfferSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(), // Lucideアイコン名
  backgroundColor: z.string(), // テーマカラー
  textColor: z.string(),
  order: z.number().default(0),
});

export type SpecialOffer = z.infer<typeof specialOfferSchema>;

// Service Type Labels
export const serviceTypeLabels: Record<ServiceType, string> = {
  "デリヘル": "デリヘル",
  "ホテヘル": "ホテヘル",
  "箱ヘル": "箱ヘル",
  "エステ": "エステ",
  "オナクラ": "オナクラ",
  "メンズエステ": "メンズエステ",
} as const;

// Zod schemas for validation
export const photoSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  tag: z.enum(photoTags),
  order: z.number().optional(),
});

// タトゥー・傷のタイプ
export const bodyMarkTypeOptions = ["タトゥー", "傷", "両方"] as const;
export type BodyMarkType = typeof bodyMarkTypeOptions[number];

export const bodyMarkSchema = z.object({
  has_body_mark: z.boolean().default(false),
  type: z.enum(bodyMarkTypeOptions).optional(),
  details: z.string().optional(),
  location: z.string().optional(),
  size: z.string().optional(),
});

// Tables
// store_profilesテーブルの追加
export const store_profiles = pgTable("store_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  business_name: text("business_name").notNull(),
  location: text("location", { enum: prefectures }).notNull(),
  service_type: text("service_type", { enum: serviceTypes }).notNull(),
  catch_phrase: text("catch_phrase").notNull(),
  description: text("description").notNull(), // HTMLコンテンツとして保存
  top_image: text("top_image"), // 店舗TOP画像のURL
  benefits: jsonb("benefits").$type<BenefitType[]>().default([]).notNull(),
  minimum_guarantee: integer("minimum_guarantee").default(0),
  maximum_guarantee: integer("maximum_guarantee").default(0),
  working_time_hours: integer("working_time_hours").default(0),
  average_hourly_pay: integer("average_hourly_pay").default(0),
  status: text("status", { enum: jobStatusTypes }).notNull().default("draft"),
  requirements: jsonb("requirements").$type<JobRequirements>().default({
    cup_size_conditions: [],
    accepts_temporary_workers: true,
    requires_arrival_day_before: false,
    prioritize_titles: false,
    other_conditions: []
  }),
  working_hours: text("working_hours"),
  transportation_support: boolean("transportation_support").default(false),
  housing_support: boolean("housing_support").default(false),
  special_offers: jsonb("special_offers").$type<SpecialOffer[]>().default([]),
  // 新規追加項目
  address: text("address"), // 住所（任意）
  recruiter_name: text("recruiter_name"), // 採用担当者名（必須）
  phone_numbers: jsonb("phone_numbers").$type<string[]>().default([]).notNull(), // 電話番号（最大4つ、最低1つ必須）
  email_addresses: jsonb("email_addresses").$type<string[]>().default([]).notNull(), // メールアドレス（最大4つ、任意）
  sns_id: text("sns_id"), // SNS ID（任意）
  sns_url: text("sns_url"), // SNS追加用URL（任意）
  sns_text: text("sns_text"), // SNSテキスト（任意）
  pc_website_url: text("pc_website_url"), // PCオフィシャルサイト（任意）
  mobile_website_url: text("mobile_website_url"), // スマホオフィシャルサイト（任意）
  application_requirements: text("application_requirements"), // 応募資格（任意）
  // 新規追加項目
  access_info: text("access_info"), // アクセス情報（最寄り駅・交通手段）
  security_measures: text("security_measures"), // セキュリティ対策・プライバシー配慮
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_id_idx: index("store_profiles_user_id_idx").on(table.user_id),
  business_name_idx: index("store_profiles_business_name_idx").on(table.business_name),
  status_idx: index("store_profiles_status_idx").on(table.status),
}));


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  birth_date: text("birth_date").notNull(),
  location: text("location", { enum: prefectures }).notNull(),
  service_type: text("service_type", { enum: serviceTypes }), // 店舗ユーザーの場合のみ使用
  preferred_locations: jsonb("preferred_locations").$type<Prefecture[]>().default([]).notNull(),
  role: text("role", { enum: ["talent", "store"] }).notNull().default("talent"),
  display_name: text("display_name").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  store_profile_id: integer("store_profile_id").notNull().references(() => store_profiles.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  store_profile_id_idx: index("applications_store_profile_id_idx").on(table.store_profile_id),
  user_id_idx: index("applications_user_id_idx").on(table.user_id),
  status_idx: index("applications_status_idx").on(table.status),
}));

export const talentProfiles = pgTable("talent_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  last_name: text("last_name").notNull(),
  first_name: text("first_name").notNull(),
  last_name_kana: text("last_name_kana").notNull(),
  first_name_kana: text("first_name_kana").notNull(),
  location: text("location", { enum: prefectures }).notNull(),
  nearest_station: text("nearest_station").notNull(),
  available_ids: jsonb("available_ids").$type<{
    types: IdType[];
    others: string[];
  }>().default({ types: [], others: [] }).notNull(),
  can_provide_residence_record: boolean("can_provide_residence_record").default(false),
  can_provide_std_test: boolean("can_provide_std_test").default(false),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  cup_size: text("cup_size", { enum: cupSizes }).notNull(),
  bust: integer("bust"),
  waist: integer("waist"),
  hip: integer("hip"),
  face_visibility: text("face_visibility", { enum: faceVisibilityTypes }).notNull(),
  // 新規追加フィールド：髪色
  hair_color: text("hair_color", { enum: hairColorTypes }),
  // 新規追加フィールド：外見タイプ
  look_type: text("look_type", { enum: lookTypes }),
  // 新規追加フィールド：肩書き・特別経験
  titles: jsonb("titles").$type<string[]>().default([]),
  can_photo_diary: boolean("can_photo_diary").default(false),
  can_home_delivery: boolean("can_home_delivery").default(false),
  ng_options: jsonb("ng_options").$type<{
    common: CommonNgOption[];
    others: string[];
  }>().default({ common: [], others: [] }).notNull(),
  allergies: jsonb("allergies").$type<{
    types: AllergyType[];
    others: string[];
    has_allergy: boolean;
  }>().default({ types: [], others: [], has_allergy: false }).notNull(),
  smoking: jsonb("smoking").$type<{
    enabled: boolean;
    types: SmokingType[];
    others: string[];
  }>().default({ enabled: false, types: [], others: [] }).notNull(),
  has_sns_account: boolean("has_sns_account").default(false),
  sns_urls: jsonb("sns_urls").$type<string[]>().default([]).notNull(),
  current_stores: jsonb("current_stores").$type<{
    store_name: string;
    stage_name: string;
  }[]>().default([]).notNull(),
  previous_stores: jsonb("previous_stores").$type<{
    store_name: string;
  }[]>().default([]).notNull(),
  photo_diary_urls: jsonb("photo_diary_urls").$type<string[]>().default([]).notNull(),
  self_introduction: text("self_introduction"),
  notes: text("notes"),
  updated_at: timestamp("updated_at").defaultNow(),
  esthe_options: jsonb("esthe_options").$type<{
    available: EstheOption[];
    ng_options: string[];
  }>().default({ available: [], ng_options: [] }).notNull(),
  has_esthe_experience: boolean("has_esthe_experience").default(false),
  esthe_experience_period: text("esthe_experience_period"),
  preferred_locations: jsonb("preferred_locations").$type<Prefecture[]>().default([]).notNull(),
  ng_locations: jsonb("ng_locations").$type<Prefecture[]>().default([]).notNull(),
  body_mark: jsonb("body_mark").$type<typeof bodyMarkSchema._type>().default({
    has_body_mark: false,
    type: undefined,
    details: "",
    location: "",
    size: ""
  }).notNull(),
  photos: jsonb("photos").$type<typeof photoSchema._type[]>().default([]).notNull(),
});

// Relations
export const store_profilesRelations = relations(store_profiles, ({ one }) => ({
  user: one(users, {
    fields: [store_profiles.user_id],
    references: [users.id],
  }),
}));

// Types
export type StoreProfile = typeof store_profiles.$inferSelect;
export type InsertStoreProfile = typeof store_profiles.$inferInsert;

// Schemas
// スキーマの追加（フォームで扱う項目のみを定義）
// 先に型定義を行い、参照できるようにする
export const jobRequirementsSchema = z.object({
  // 年齢条件
  age_min: z.number().min(18).max(99).optional(),
  age_max: z.number().min(18).max(99).optional(),
  
  // スペック条件（身長-体重=スペック）
  spec_min: z.number().optional(),
  spec_max: z.number().optional(),
  
  // カップサイズ別特別条件
  cup_size_conditions: z.array(z.object({
    cup_size: z.enum(cupSizes),
    spec_min: z.number(),
  })).optional(),
  
  // 出稼ぎ関連条件
  accepts_temporary_workers: z.boolean().default(true), // 出稼ぎ受け入れ可否
  requires_arrival_day_before: z.boolean().default(false), // 前日入り必須かどうか
  
  // 体型系統設定
  preferred_body_types: z.array(z.enum([
    "スレンダー", "やや細め", "普通", "ややぽっちゃり", "ぽっちゃり", "太め"
  ])).optional(),
  
  // タトゥー・傷の受け入れレベル
  tattoo_acceptance: z.enum(tattooAcceptanceLevels).optional(),
  
  // 髪色系統
  preferred_hair_colors: z.array(z.enum(hairColorTypes)).optional(),
  
  // ルックス系統
  preferred_look_types: z.array(z.enum(lookTypes)).optional(),
  
  // 優遇項目（肩書持ち）
  prioritize_titles: z.boolean().default(false), // AV女優、アイドル、モデルなどの肩書持ち優遇
  
  // その他条件
  other_conditions: z.array(z.string()).default([]),
});

export type JobRequirements = z.infer<typeof jobRequirementsSchema>;

export const storeProfileSchema = z.object({
  // 基本情報
  catch_phrase: z.string()
    .min(1, "キャッチコピーを入力してください")
    .max(300, "キャッチコピーは300文字以内で入力してください"),
  description: z.string()
    .min(1, "仕事内容を入力してください")
    .max(9000, "仕事内容は9000文字以内で入力してください"),
  top_image: z.string().optional(), // 店舗TOP画像のURL
  
  // 待遇情報
  benefits: z.array(z.enum(allBenefitTypes)).default([]),
  minimum_guarantee: z.coerce.number().nonnegative("最低保証は0以上の値を入力してください").default(0),
  maximum_guarantee: z.coerce.number().nonnegative("最高保証は0以上の値を入力してください").default(0),
  working_time_hours: z.coerce.number().nonnegative("勤務時間は0以上の値を入力してください").default(0),
  average_hourly_pay: z.coerce.number().nonnegative("時給単価は0以上の値を入力してください").default(0),
  status: z.enum(jobStatusTypes).default("draft"),
  requirements: z.union([z.string(), jobRequirementsSchema]).optional(),
  working_hours: z.string().optional(),
  transportation_support: z.boolean().default(false),
  housing_support: z.boolean().default(false),
  special_offers: z.array(specialOfferSchema).optional(),
  
  // 新規追加項目
  address: z.string().optional(), // 住所（任意）
  recruiter_name: z.string().min(1, "採用担当者名を入力してください"), // 採用担当者名（必須）
  
  // 連絡先情報
  phone_numbers: z.array(z.string())
    .min(1, "電話番号を少なくとも1つ入力してください")
    .max(4, "電話番号は最大4つまで登録できます")
    .default([]), // 電話番号（最大4つ、最低1つ必須）
  
  email_addresses: z.array(
    z.string().optional().or(z.string().email("有効なメールアドレスを入力してください"))
  )
    .max(4, "メールアドレスは最大4つまで登録できます")
    .default([]), // メールアドレス（最大4つ、任意）
  
  // SNS情報
  sns_id: z.string().optional(), // SNS ID（任意）
  sns_url: z.string().optional().or(z.string().url("有効なURLを入力してください")), // SNS追加用URL（任意）
  sns_text: z.string().max(100, "SNSテキストは100文字以内で入力してください").optional(), // SNSテキスト（任意）
  
  // ウェブサイト情報
  pc_website_url: z.string().optional().or(z.string().url("有効なURLを入力してください")), // PCオフィシャルサイト（任意）
  mobile_website_url: z.string().optional().or(z.string().url("有効なURLを入力してください")), // スマホオフィシャルサイト（任意）
  
  // 応募要件
  application_requirements: z.string().max(1000, "応募資格は1000文字以内で入力してください").optional(), // 応募資格（任意）
  
  // 追加項目
  access_info: z.string().max(1000, "アクセス情報は1000文字以内で入力してください").optional(), // アクセス情報
  security_measures: z.string().max(1000, "セキュリティ対策は1000文字以内で入力してください").optional(), // セキュリティ対策
});

export type StoreProfileFormData = z.infer<typeof storeProfileSchema>;

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  role: z.enum(["talent", "store"]).optional(),
});

export const applicationSchema = createInsertSchema(applications, {
  message: z.string().optional(),
})
  .omit({ id: true, created_at: true, updated_at: true });

export type LoginData = z.infer<typeof loginSchema>;

// Response types

export interface StoreProfileListResponse {
  profiles: StoreProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export type UserResponse = {
  id: number;
  email: string;
  username: string;
  birthDate: string; // キャメルケースに修正
  location: string;
  preferredLocations: string[]; // キャメルケースに修正
  role: "talent" | "store";
  displayName?: string; // 表示名を追加
};

export const talentProfileSchema = z.object({
  last_name: z.string().min(1, "姓を入力してください"),
  first_name: z.string().min(1, "名を入力してください"),
  last_name_kana: z.string()
    .min(1, "姓（カナ）を入力してください")
    .regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  first_name_kana: z.string()
    .min(1, "名（カナ）を入力してください")
    .regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  // 生年月日情報をスキーマに追加（ユーザーテーブルから取得されるため必須ではない）
  birth_date: z.string().nullable().optional(),
  location: z.enum(prefectures, {
    required_error: "都道府県を選択してください",
  }),
  nearest_station: z.string().min(1, "最寄り駅を入力してください"),
  available_ids: z.object({
    types: z.array(z.enum(idTypes)).min(1, "身分証明書を1つ以上選択してください"),
    others: z.array(z.string()).default([]),
  }).default({ types: [], others: [] }),
  can_provide_residence_record: z.boolean().default(false),
  can_provide_std_test: z.boolean().default(false),
  height: z.number().min(100).max(200),
  weight: z.number().min(30).max(150),
  cup_size: z.enum(cupSizes, {
    required_error: "カップサイズを選択してください",
  }),
  bust: z.number().nullable(),
  waist: z.number().nullable(),
  hip: z.number().nullable(),
  face_visibility: z.enum(faceVisibilityTypes, {
    required_error: "パネルの顔出し設定を選択してください",
  }),
  // 新しいフィールド：タトゥー/傷のレベル
  tattoo_level: z.enum(tattooAcceptanceLevels).optional(),
  // 新しいフィールド：髪色
  hair_color: z.enum(hairColorTypes).optional(),
  // 新しいフィールド：外見スタイル
  look_type: z.enum(lookTypes).optional(),
  // 新しいフィールド：タイトル（芸能人/モデル経験など）
  titles: z.array(z.string()).default([]),
  can_photo_diary: z.boolean().default(false),
  can_home_delivery: z.boolean().default(false),
  ng_options: z.object({
    common: z.array(z.enum(commonNgOptions)).default([]),
    others: z.array(z.string()).default([]),
  }).default({ common: [], others: [] }),
  allergies: z.object({
    types: z.array(z.enum(allergyTypes)).default([]),
    others: z.array(z.string()).default([]),
    has_allergy: z.boolean().default(false),
  }).default({ types: [], others: [], has_allergy: false }),
  smoking: z.object({
    enabled: z.boolean().default(false),
    types: z.array(z.enum(smokingTypes)).default([]),
    others: z.array(z.string()).default([]),
  }).default({ enabled: false, types: [], others: [] }),
  has_sns_account: z.boolean().default(false),
  sns_urls: z.array(z.string()).default([]),
  current_stores: z.array(z.object({
    store_name: z.string(),
    stage_name: z.string(),
  })).default([]),
  previous_stores: z.array(z.object({
    store_name: z.string(),
  })).default([]),
  photo_diary_urls: z.array(z.string()).default([]),
  self_introduction: z.string().optional(),
  notes: z.string().optional(),
  esthe_options: z.object({
    available: z.array(z.enum(estheOptions)).default([]),
    ng_options: z.array(z.string()).default([]),
  }).default({ available: [], ng_options: [] }),
  has_esthe_experience: z.boolean().default(false),
  esthe_experience_period: z.string().optional(),
  preferred_locations: z.array(z.enum(prefectures)).default([]),
  ng_locations: z.array(z.enum(prefectures)).default([]),
  body_mark: z.object({
    has_body_mark: z.boolean().default(false),
    type: z.enum(bodyMarkTypeOptions).optional(),
    details: z.string().optional(),
    location: z.string().optional(),
    size: z.string().optional(),
  }).default({
    has_body_mark: false,
    type: undefined,
    details: "",
    location: "",
    size: ""
  }),
  photos: z.array(photoSchema)
    .min(1, "少なくとも1枚の写真が必要です")
    .max(20, "写真は最大20枚までです")
    .refine(
      (photos) => photos.some((photo) => photo.tag === "現在の髪色"),
      "現在の髪色の写真は必須です"
    ),
});

export const talentProfileUpdateSchema = talentProfileSchema.extend({
  current_password: z.string().optional(),
  new_password: z.string()
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
}).partial();

export type TalentProfileUpdate = z.infer<typeof talentProfileUpdateSchema>;

export const baseUserSchema = createInsertSchema(users).omit({ id: true });

export const userSchema = createInsertSchema(users, {
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  role: z.enum(["talent", "store"], {
    required_error: "ユーザータイプを選択してください",
    invalid_type_error: "無効なユーザータイプです",
  }),
  service_type: z.enum(serviceTypes).optional(), // 店舗ユーザーの場合のみ必須
  display_name: z.string().min(1, "表示名を入力してください"),
  location: z.enum(prefectures, {
    required_error: "所在地を選択してください",
    invalid_type_error: "無効な所在地です",
  }),
  birth_date: z.date({
    required_error: "生年月日を入力してください",
    invalid_type_error: "無効な日付形式です",
  }),
}).omit({ id: true, created_at: true, updated_at: true })
  .superRefine((data, ctx) => {
    if (data.role === "store" && !data.service_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "店舗ユーザーの場合、業種の選択は必須です",
        path: ["service_type"]
      });
    }
  });

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  store_id: integer("store_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "published", "scheduled"] }).notNull().default("draft"),
  published_at: timestamp("published_at"),
  scheduled_at: timestamp("scheduled_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  thumbnail: text("thumbnail"),
  images: jsonb("images").$type<string[]>().default([]),
}, (table) => {
  return {
    store_id_idx: index("blog_posts_store_id_idx").on(table.store_id),
    status_idx: index("blog_posts_status_idx").on(table.status),
    published_at_idx: index("blog_posts_published_at_idx").on(table.published_at),
  };
});

export const blogPostSchema = createInsertSchema(blogPosts)
  .extend({
    images: z.array(z.string()).optional(),
    scheduled_at: z.union([
      z.date(),
      z.string().transform((val) => new Date(val)),
      z.null(),
    ]).optional(),
    published_at: z.union([
      z.date(),
      z.string().transform((val) => new Date(val)),
      z.null(),
    ]).optional(),
    status: z.enum(["draft", "published", "scheduled"]),
    title: z.string().min(1, "タイトルは必須です"),
    content: z.string().min(1, "本文は必須です"),
    thumbnail: z.string().nullable().optional(),
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .superRefine((data, ctx) => {
    if (data.status === "scheduled") {
      if (!data.scheduled_at) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "予約投稿には公開日時の指定が必要です",
          path: ["scheduled_at"]
        });
      } else {
        const scheduledDate = new Date(data.scheduled_at);
        if (scheduledDate <= new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "予約日時は現在時刻より後に設定してください",
            path: ["scheduled_at"]
          });
        }
      }
    }
  });

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  store: one(users, {
    fields: [blogPosts.store_id],
    references: [users.id],
  }),
}));

export interface BlogPostListResponse {
  posts: BlogPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export type Photo = z.infer<typeof photoSchema>;
export type BodyMark = z.infer<typeof bodyMarkSchema>;
export type SelectUser = {
  id: number;
  username: string;
  role: "talent" | "store";
  display_name: string;
  location: string;
  birth_date: string;
  birth_date_modified: boolean;
  preferred_locations: string[];
  created_at: Date;
};

export type TalentProfileData = z.infer<typeof talentProfileSchema>;
export type InsertTalentProfile = typeof talentProfiles.$inferInsert;
export type ProfileData = TalentProfileData;
export type RegisterFormData = z.infer<typeof talentRegisterFormSchema>;

export interface StoreProfileResponse extends StoreProfile {
  hasApplied?: boolean;
  applicationStatus?: string;
}

export const keepList = pgTable('keepList', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  store_profile_id: integer('store_profile_id').notNull().references(() => store_profiles.id),
  store_id: integer('store_id').references(() => store_profiles.id),
  created_at: timestamp('created_at').defaultNow(),
  added_at: timestamp('added_at').defaultNow(),
  note: text('note')
}, (table) => {
  return {
    user_id_idx: index('keep_list_user_id_idx').on(table.user_id),
    store_profile_id_idx: index('keep_list_store_profile_id_idx').on(table.store_profile_id),
    store_id_idx: index('keep_list_store_id_idx').on(table.store_id),
  };
});

export const viewHistory = pgTable('viewHistory', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  store_profile_id: integer('store_profile_id').notNull().references(() => store_profiles.id),
  store_id: integer('store_id').references(() => store_profiles.id),
  created_at: timestamp('created_at').defaultNow(),
  viewed_at: timestamp('viewed_at').defaultNow()
}, (table) => {
  return {
    user_id_idx: index('view_history_user_id_idx').on(table.user_id),
    store_profile_id_idx: index('view_history_store_profile_id_idx').on(table.store_profile_id),
    store_id_idx: index('view_history_store_id_idx').on(table.store_id),
    viewed_at_idx: index('view_history_viewed_at_idx').on(table.viewed_at),
  };
});

export type KeepList = typeof keepList.$inferSelect;
export type InsertKeepList = typeof keepList.$inferInsert;
export type ViewHistory = typeof viewHistory.$inferSelect;
export type InsertViewHistory = typeof viewHistory.$inferInsert;

export const keepListSchema = createInsertSchema(keepList);
export const viewHistorySchema = createInsertSchema(viewHistory);

export const applicationsRelations = relations(applications, ({ one }) => ({
  store_profile: one(store_profiles, {
    fields: [applications.store_profile_id],
    references: [store_profiles.id],
  }),
  user: one(users, {
    fields: [applications.user_id],
    references: [users.id],
  }),
}));

export const keepListRelations = relations(keepList, ({ one }) => ({
  store_profile: one(store_profiles, {
    fields: [keepList.store_profile_id],
    references: [store_profiles.id],
  }),
  user: one(users, {
    fields: [keepList.user_id],
    references: [users.id],
  }),
}));

export const viewHistoryRelations = relations(viewHistory, ({ one }) => ({
  store_profile: one(store_profiles, {
    fields: [viewHistory.store_profile_id],
    references: [store_profiles.id],
  }),
  user: one(users, {
    fields: [viewHistory.user_id],
    references: [users.id],
  }),
}));

export type PreviousStore = {
  store_name: string;
};

// 登録フォーム用のスキーマ定義（簡略化されたもの）
// 完全な登録スキーマ
export const fullTalentRegisterFormSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string()
    .min(8, "パスワードは8文字以上である必要があります")
    .regex(
      /^(?=.*[a-z])(?=.*[0-9])[a-zA-Z0-9!#$%\(\)\+,\-\./:=?@\[\]\^_`\{\|\}]*$/,
      "パスワードは半角英字小文字、半角数字をそれぞれ1種類以上含める必要があります"
    ),
  passwordConfirm: z.string().min(1, "確認用パスワードを入力してください"),
  username: z.string().min(1, "ニックネームを入力してください"),
  birthDate: z.string().min(1, "生年月日を入力してください"),
  location: z.enum(prefectures, {
    required_error: "都道府県を選択してください",
  }),
  preferredLocations: z.array(z.enum(prefectures)).min(1, "希望地域を1つ以上選択してください"),
  lastNameKana: z.string()
    .min(1, "姓（カナ）を入力してください")
    .regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  firstNameKana: z.string()
    .min(1, "名（カナ）を入力してください")
    .regex(/^[ァ-ヶー]+$/, "カタカナで入力してください"),
  nearestStation: z.string().min(1, "最寄り駅を入力してください"),
  height: z.coerce.number()
    .min(100, "身長は100cm以上で入力してください")
    .max(200, "身長は200cm以下で入力してください"),
  weight: z.coerce.number()
    .min(30, "体重は30kg以上で入力してください")
    .max(150, "体重は150kg以下で入力してください"),
  cupSize: z.enum(cupSizes, {
    required_error: "カップサイズを選択してください",
  }),
  faceVisibility: z.enum(faceVisibilityTypes, {
    required_error: "パネルの顔出し設定を選択してください",
  }),
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "利用規約に同意してください",
  }),
  role: z.enum(["talent", "store"]).default("talent")
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードと確認用パスワードが一致しません",
  path: ["passwordConfirm"],
});

// 登録ページの最初のステップで使用する簡易登録スキーマ
export const talentRegisterFormSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string()
    .min(8, "パスワードは8文字以上である必要があります")
    .regex(
      /^(?=.*[a-z])(?=.*[0-9])[a-zA-Z0-9!#$%\(\)\+,\-\./:=?@\[\]\^_`\{\|\}]*$/,
      "パスワードは半角英字小文字、半角数字をそれぞれ1種類以上含める必要があります"
    ),
  passwordConfirm: z.string().min(1, "確認用パスワードを入力してください"),
  username: z.string().min(1, "ニックネームを入力してください"),
  birthDate: z.string().min(1, "生年月日を入力してください"),
  location: z.enum(prefectures, {
    required_error: "都道府県を選択してください",
  }),
  preferredLocations: z.array(z.enum(prefectures)).min(1, "希望地域を1つ以上選択してください"),
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "利用規約に同意してください",
  }),
  role: z.enum(["talent", "store"]).default("talent")
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードと確認用パスワードが一致しません",
  path: ["passwordConfirm"],
});

export const talentProfileRelations = relations(talentProfiles, ({ one }) => ({
    user: one(users, {
        fields: [talentProfiles.user_id],
        references: [users.id],
    }),
}));

// StoreProfileListResponseはすでに上部で定義されています。

// JobResponse型の定義 - クライアント側の型定義
export interface JobResponse {
  id: number;
  businessName: string;
  location: Prefecture;
  serviceType: ServiceType;
  catchPhrase: string;
  description: string;
  transportationSupport: boolean;
  housingSupport: boolean;
  minimumGuarantee: number | null;
  maximumGuarantee: number | null;
  workingTimeHours?: number | null;    // 勤務時間（時間単位）
  averageHourlyPay?: number | null;    // 時給平均（円）
  workingHours: string;
  requirements: string;
  benefits: BenefitType[];
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // 店舗詳細ページ用の追加フィールド
  top_image?: string;             // トップ画像
  address?: string;               // 住所
  access_info?: string;           // アクセス情報
  security_measures?: string;     // セキュリティ対策
  recruiter_name?: string;        // 採用担当者名
  phone_numbers?: string[];       // 電話番号リスト
  email_addresses?: string[];     // メールアドレスリスト
  pc_website_url?: string;        // PCサイトURL
  mobile_website_url?: string;    // モバイルサイトURL
  application_requirements?: string; // 応募条件
}