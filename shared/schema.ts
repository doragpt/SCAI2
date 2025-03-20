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

// 待遇の定義
export const benefitTypes = {
  interview: [
    "見学だけでもOK",
    "体験入店OK",
    "店外面接OK",
    "面接交通費支給",
    "友達と面接OK",
    "オンライン面接OK",
    "写メ面接OK",
    "即日勤務OK",
    "入店特典あり"
  ],
  workStyle: [
    "自由出勤OK",
    "週1日〜OK",
    "週3日以上歓迎",
    "週5日以上歓迎",
    "土日だけOK",
    "1日3時間〜OK",
    "短期OK",
    "長期休暇OK",
    "掛け持ちOK"
  ],
  salary: [
    "日給2万円以上",
    "日給3万円以上",
    "日給4万円以上",
    "日給5万円以上",
    "日給6万円以上",
    "日給7万円以上",
  ],
  bonus: [
    "バック率50%以上",
    "バック率60%以上",
    "バック率70%以上",
    "完全日払いOK",
    "保証制度あり",
    "指名バックあり",
    "オプションバックあり",
    "ボーナスあり"
  ],
  facility: [
    "送迎あり",
    "駅チカ",
    "駐車場完備",
    "個室待機",
    "アリバイ対策OK",
    "寮完備",
    "託児所あり",
    "制服貸与",
    "食事支給"
  ],
  requirements: [
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
  ]
} as const;

// フラットな待遇リストの生成
export const allBenefitTypes = [
  ...benefitTypes.interview,
  ...benefitTypes.workStyle,
  ...benefitTypes.salary,
  ...benefitTypes.bonus,
  ...benefitTypes.facility,
  ...benefitTypes.requirements,
] as const;

export const benefitCategories = {
  interview: "面接・入店前",
  workStyle: "働き方自由",
  salary: "お給料目安",
  bonus: "お給料+α",
  facility: "お店の環境",
  requirements: "採用について"
} as const;

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

export const bodyTypes = ["スリム", "普通", "グラマー", "ぽっちゃり"] as const;
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

// Type definitions
export type Prefecture = typeof prefectures[number];
export type PhotoTag = typeof photoTags[number];
export type BodyType = typeof bodyTypes[number];
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

// 一時的なserviceTypes定義（互換性維持のため）
export const serviceTypes = [
  "デリヘル",
  "ホテヘル",
  "箱ヘル",
  "エステ",
  "オナクラ",
  "メンズエステ"
] as const;

export type ServiceType = typeof serviceTypes[number];

// 既存のserviceTypeLabels定義を更新
export const serviceTypeLabels: Record<ServiceType, string> = {
  "デリヘル": "デリヘル",
  "ホテヘル": "ホテヘル",
  "箱ヘル": "箱ヘル",
  "エステ": "エステ",
  "オナクラ": "オナクラ",
  "メンズエステ": "メンズエステ"
};


// Tablesの定義
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  location: text("location").notNull(),
  catchPhrase: text("catch_phrase").notNull(),
  description: text("description").notNull(),
  benefits: jsonb("benefits").$type<BenefitType[]>().default([]).notNull(),
  minimumGuarantee: integer("minimum_guarantee").default(0),
  maximumGuarantee: integer("maximum_guarantee").default(0),
  status: text("status", { enum: jobStatusTypes }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  businessNameIdx: index("jobs_business_name_idx").on(table.businessName),
  statusIdx: index("jobs_status_idx").on(table.status),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  birthDate: text("birth_date").notNull(),
  location: text("location", { enum: prefectures }).notNull(),
  preferredLocations: jsonb("preferred_locations").$type<Prefecture[]>().default([]).notNull(),
  role: text("role", { enum: ["talent", "store"] }).notNull().default("talent"),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  jobIdIdx: index("applications_job_id_idx").on(table.jobId),
  userIdIdx: index("applications_user_id_idx").on(table.userId),
  statusIdx: index("applications_status_idx").on(table.status),
}));

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
  preferredLocations: jsonb("preferred_locations").$type<Prefecture[]>().default([]).notNull(),
  ngLocations: jsonb("ng_locations").$type<Prefecture[]>().default([]).notNull(),
  bodyMark: jsonb("body_mark").$type<typeof bodyMarkSchema._type>().default({
    hasBodyMark: false,
    details: "",
    others: []
  }).notNull(),
  photos: jsonb("photos").$type<typeof photoSchema._type[]>().default([]).notNull(),
});

// Relations
export const jobsRelations = relations(jobs, ({ one, many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
}));


// Zod schemas for validation
export const photoSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  tag: z.enum(photoTags),
  order: z.number().optional(),
});

export const bodyMarkSchema = z.object({
  hasBodyMark: z.boolean().default(false),
  details: z.string().optional(),
  others: z.array(z.string()).default([]),
});

// jobSchemaを分割
// フォーム入力用のスキーマ
export const jobFormSchema = z.object({
  catchPhrase: z.string()
    .min(1, "キャッチコピーを入力してください")
    .max(300, "キャッチコピーは300文字以内で入力してください"),
  description: z.string()
    .min(1, "仕事内容を入力してください")
    .max(9000, "仕事内容は9000文字以内で入力してください"),
  benefits: z.array(z.enum(allBenefitTypes)).default([]),
  minimumGuarantee: z.coerce.number().nonnegative("最低保証は0以上の値を入力してください").default(0),
  maximumGuarantee: z.coerce.number().nonnegative("最高保証は0以上の値を入力してください").default(0),
  status: z.enum(jobStatusTypes).default("draft"),
});

// 保存用の完全なスキーマ
export const jobSchema = jobFormSchema.extend({
  businessName: z.string().min(1, "店舗名は必須です"),
  location: z.string().min(1, "所在地は必須です"),
  serviceType: z.enum(serviceTypes).default("デリヘル"), // デフォルト値を設定
});

// 型定義
export type JobFormData = z.infer<typeof jobFormSchema>;
export type Job = z.infer<typeof jobSchema>;

export const applicationSchema = createInsertSchema(applications, {
  message: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type LoginData = z.infer<typeof loginSchema>;

// Response types
export interface JobListingResponse {
  jobs: Job[];
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
  birthDate: string;
  location: string;
  preferredLocations: string[];
  role: "talent" | "store";
};

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
    others: z.array(z.string()).default([]),
  }).default({ types: [], others: [] }),
  canProvideResidenceRecord: z.boolean().default(false),
  height: z.number().min(100).max(200),
  weight: z.number().min(30).max(150),
  cupSize: z.enum(cupSizes, {
    required_error: "カップサイズを選択してください",
  }),
  bust: z.number().nullable(),
  waist: z.number().nullable(),
  hip: z.number().nullable(),
  faceVisibility: z.enum(faceVisibilityTypes, {
    required_error: "パネルの顔出し設定を選択してください",
  }),
  canPhotoDiary: z.boolean().default(false),
  canHomeDelivery: z.boolean().default(false),
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
  hasSnsAccount: z.boolean().default(false),
  snsUrls: z.array(z.string()).default([]),
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })).default([]),
  previousStores: z.array(z.object({
    storeName: z.string(),
  })).default([]),
  photoDiaryUrls: z.array(z.string()).default([]),
  selfIntroduction: z.string().optional(),
  notes: z.string().optional(),
  estheOptions: z.object({
    available: z.array(z.enum(estheOptions)).default([]),
    ngOptions: z.array(z.string()).default([]),
  }).default({ available: [], ngOptions: [] }),
  hasEstheExperience: z.boolean().default(false),
  estheExperiencePeriod: z.string().optional(),
  preferredLocations: z.array(z.enum(prefectures)).default([]),
  ngLocations: z.array(z.enum(prefectures)).default([]),
  bodyMark: z.object({
    hasBodyMark: z.boolean().default(false),
    details: z.string().optional(),
    others: z.array(z.string()).default([]),
  }).default({
    hasBodyMark: false,
    details: "",
    others: []
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
}).partial();

export type TalentProfileUpdate = z.infer<typeof talentProfileUpdateSchema>;

export const baseUserSchema = createInsertSchema(users).omit({ id: true });

export const jobRequirementsSchema = z.object({
  ageMin: z.number().min(18).max(99).optional(),
  ageMax: z.number().min(18).max(99).optional(),
  specMin: z.number().optional(),
  specMax: z.number().optional(),
  cupSizeConditions: z.array(z.object({
    cupSize: z.enum(cupSizes),
    specMin: z.number(),
  })).optional(),
  otherConditions: z.array(z.string()).default([]),
});

export type JobRequirements = z.infer<typeof jobRequirementsSchema>;

export const userSchema = createInsertSchema(users, {
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  role: z.enum(["talent", "store"], {
    required_error: "ユーザータイプを選択してください",
    invalid_type_error: "無効なユーザータイプです",
  }),
  displayName: z.string().min(1, "表示名を入力してください"),
  location: z.enum(prefectures, {
    required_error: "所在地を選択してください",
    invalid_type_error: "無効な所在地です",
  }),
  birthDate: z.date({
    required_error: "生年月日を入力してください",
    invalid_type_error: "無効な日付形式です",
  }),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "published", "scheduled"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  thumbnail: text("thumbnail"),
  images: jsonb("images").$type<string[]>().default([]),
}, (table) => {
  return {
    storeIdIdx: index("blog_posts_store_id_idx").on(table.storeId),
    statusIdx: index("blog_posts_status_idx").on(table.status),
    publishedAtIdx: index("blog_posts_published_at_idx").on(table.publishedAt),
  };
});

export const blogPostSchema = createInsertSchema(blogPosts)
  .extend({
    images: z.array(z.string()).optional(),
    scheduledAt: z.union([
      z.date(),
      z.string().transform((val) => new Date(val)),
      z.null(),
    ]).optional(),
    publishedAt: z.union([
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
    createdAt: true,
    updatedAt: true,
  })
  .superRefine((data, ctx) => {
    if (data.status === "scheduled") {
      if (!data.scheduledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "予約投稿には公開日時の指定が必要です",
          path: ["scheduledAt"]
        });
      } else {
        const scheduledDate = new Date(data.scheduledAt);
        if (scheduledDate <= new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "予約日時は現在時刻より後に設定してください",
            path: ["scheduledAt"]
          });
        }
      }
    }
  });

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  store: one(users, {
    fields: [blogPosts.storeId],
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
export type TalentProfileUpdate = z.infer<typeof talentProfileUpdateSchema>;
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

export type TalentProfileData = z.infer<typeof talentProfileSchema>;
export type InsertTalentProfile = typeof talentProfiles.$inferInsert;
export type ProfileData = TalentProfileData;
export type RegisterFormData = z.infer<typeof talentRegisterFormSchema>;


export type { User, TalentProfile, Job, Application, InsertApplication };
export type { Prefecture, BodyType, CupSize, PhotoTag, FaceVisibility, IdType, AllergyType, SmokingType, CommonNgOption, EstheOption, BenefitType, BenefitCategory, ServiceType };

export interface JobListingResponse {
  jobs: Job[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface JobResponse extends Job {
  hasApplied?: boolean;
  applicationStatus?: string;
}

export const keepList = pgTable('keepList', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  addedAt: timestamp('added_at').defaultNow(),
  note: text('note')
}, (table) => {
  return {
    userIdIdx: index('keep_list_user_id_idx').on(table.userId),
    jobIdIdx: index('keep_list_job_id_idx').on(table.jobId),
  };
});

export const viewHistory = pgTable('viewHistory', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  viewedAt: timestamp('viewed_at').defaultNow()
}, (table) => {
  return {
    userIdIdx: index('view_history_user_id_idx').on(table.userId),
    jobIdIdx: index('view_history_job_id_idx').on(table.jobId),
    viewedAtIdx: index('view_history_viewed_at_idx').on(table.viewedAt),
  };
});

export type KeepList = typeof keepList.$inferSelect;
export type InsertKeepList = typeof keepList.$inferInsert;
export type ViewHistory = typeof viewHistory.$inferSelect;
export type InsertViewHistory = typeof viewHistory.$inferInsert;

export const keepListSchema = createInsertSchema(keepList);
export const viewHistorySchema = createInsertSchema(viewHistory);

export const keepListRelations = relations(keepList, ({ one }) => ({
  job: one(jobs, {
    fields: [keepList.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [keepList.userId],
    references: [users.id],
  }),
}));

export const viewHistoryRelations = relations(viewHistory, ({ one }) => ({
  job: one(jobs, {
    fields: [viewHistory.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [viewHistory.userId],
    references: [users.id],
  }),
}));

export type PreviousStore = {
  storeName: string;
};

export const talentRegisterFormSchema = talentProfileSchema;

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  role: z.enum(["talent", "store"]).optional(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
export type TalentProfile = typeof talentProfiles.$inferSelect;

// 互換性維持のための空のオブジェクト
export const serviceTypeLabels: Record<string, string> = {};