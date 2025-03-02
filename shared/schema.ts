import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 都道府県の列挙型を追加
export const prefectures = [
  "北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県",
  "群馬県", "栃木県", "茨城県", "東京都", "神奈川県", "千葉県", "埼玉県",
  "愛知県", "静岡県", "三重県", "岐阜県", "石川県", "福井県", "富山県",
  "新潟県", "長野県", "山梨県", "大阪府", "兵庫県", "京都府", "滋賀県",
  "奈良県", "和歌山県", "広島県", "岡山県", "山口県", "鳥取県", "島根県",
  "香川県", "徳島県", "高知県", "愛媛県", "福岡県", "長崎県", "大分県",
  "佐賀県", "熊本県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

export type Prefecture = typeof prefectures[number];

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

// 基本スキーマを作成
const baseUserSchema = createInsertSchema(users).omit({ age: true });

// ログインスキーマを追加
export const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  role: z.enum(["talent", "store"]),
});

// タレント用スキーマ
const talentUserSchema = baseUserSchema.extend({
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
  birthDate: z.string()
    .transform((date) => new Date(date))
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 18;
    }, "18歳未満の方は登録できません"),
  location: z.enum(prefectures, {
    errorMap: () => ({ message: "在住地を選択してください" })
  }),
  preferredLocations: z.array(z.enum(prefectures)).min(1, "働きたい地域を選択してください"),
});

// 店舗用スキーマ
const storeUserSchema = baseUserSchema.extend({
  role: z.literal("store"),
  username: z.string()
    .min(1, "店舗IDを入力してください")
    .max(20, "店舗IDは20文字以内で入力してください")
    .regex(/^[a-zA-Z0-9]*$/, "半角英数字で入力してください"),
  password: z.string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(48, "パスワードは48文字以内で入力してください")
    .regex(/^(?=.*[a-z])(?=.*[0-9])[a-zA-Z0-9!#$%\(\)\+,\-\./:=?@\[\]\^_`\{\|\}]*$/,
      "半角英字小文字、半角数字をそれぞれ1種類以上含める必要があります"),
  displayName: z.string().min(1, "店舗名を入力してください"),
  location: z.string().min(1, "所在地を入力してください"),
  birthDate: z.date().optional(),
});

// ユーザースキーマを統合
export const insertUserSchema = z.discriminatedUnion("role", [
  talentUserSchema,
  storeUserSchema,
]);

// 求人情報の型定義
export type StoreProfile = {
  id: number;
  businessName: string;
  serviceType: string;
  location: string;
  minimumGuarantee?: number;
  maximumGuarantee?: number;
  transportationSupport: boolean;
  housingSupport: boolean;
};

export type LoginData = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;