import { z } from "zod";
import { prefectures } from "@/lib/constants";

// 都道府県の型を定義
const PrefectureSchema = z.enum(prefectures as [string, ...string[]]);

// エステオプションの型を定義
const EstheOptionSchema = z.object({
  available: z.array(z.string()),
  ngOptions: z.array(z.string()),
});

export const profileSchema = z.object({
  // 基本情報（必須）
  lastName: z.string().min(1, "姓を入力してください"),
  firstName: z.string().min(1, "名を入力してください"),
  lastNameKana: z.string().min(1, "姓（カナ）を入力してください"),
  firstNameKana: z.string().min(1, "名（カナ）を入力してください"),
  location: PrefectureSchema,
  nearestStation: z.string().min(1, "最寄り駅を入力してください"),

  // 身体的特徴（必須）
  height: z.number().min(140).max(200),
  weight: z.number().min(30).max(120),
  bust: z.number().min(50).max(150),
  waist: z.number().min(50).max(150),
  hip: z.number().min(50).max(150),
  cupSize: z.string(),

  // 身分証明書
  availableIds: z.object({
    types: z.array(z.string()).optional(),
    others: z.array(z.string()).optional(),
  }),
  canProvideResidenceRecord: z.boolean(),

  // 写真関連
  faceVisibility: z.string(),
  canPhotoDiary: z.boolean(),
  photoDiaryUrls: z.array(z.string()).optional(),
  photos: z.array(z.object({
    url: z.string(),
    tag: z.string(),
  })),

  // 自宅派遣関連
  canHomeDelivery: z.boolean(),

  // NGオプション
  ngOptions: z.object({
    common: z.array(z.string()),
    others: z.array(z.string()),
  }),

  // アレルギー
  allergies: z.object({
    types: z.array(z.string()),
    others: z.array(z.string()),
    hasAllergy: z.boolean(),
  }),

  // 喫煙
  smoking: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()),
    others: z.array(z.string()),
  }),

  // SNS情報
  hasSnsAccount: z.boolean(),
  snsUrls: z.array(z.string()),

  // 店舗情報
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })),
  previousStores: z.array(z.object({
    storeName: z.string(),
  })),

  // エステ関連
  hasEstheExperience: z.boolean(),
  estheExperiencePeriod: z.string().optional(),
  estheOptions: EstheOptionSchema,

  // 身体的特徴（追加）
  bodyMark: z.object({
    has_body_mark: z.boolean(),
    details: z.string(),
    others: z.array(z.string()),
  }),

  // PR・備考
  selfIntroduction: z.string().optional(),
  notes: z.string().optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;