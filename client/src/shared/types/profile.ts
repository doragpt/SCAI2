import { z } from "zod";

export const profileSchema = z.object({
  // 基本情報
  lastName: z.string(),  // 性
  firstName: z.string(), // 名
  lastNameKana: z.string(), // 性 (カナ)
  firstNameKana: z.string(), // 名 (カナ)
  birthDate: z.string(), // 生年月日
  age: z.number(), // 年齢
  phoneNumber: z.string(), // 電話番号
  email: z.string(), // メールアドレス

  // 住所情報
  location: z.string(), // 在住地
  nearestStation: z.string(), // 最寄り駅

  // 身体的特徴
  height: z.number(), // 身長 (cm)
  weight: z.number(), // 体重 (kg)
  bust: z.number(), // バスト (cm)
  waist: z.number(), // ウエスト (cm)
  hip: z.number(), // ヒップ (cm)
  cupSize: z.string(), // カップサイズ

  // 身分証明書
  availableIds: z.object({
    types: z.array(z.string()).optional(), // 提示可能な身分証明書の種類
    others: z.array(z.string()).optional(), // その他の身分証明書
  }),
  canProvideResidenceRecord: z.boolean(), // 本籍地記載の住民票の可否

  // 写真関連
  faceVisibility: z.string(), // 顔出し設定
  photoDiaryAllowed: z.boolean(), // 写メ日記の投稿可否

  // 自宅派遣関連
  canHomeDelivery: z.boolean(), // 自宅派遣の可否

  // NGオプション
  ngOptions: z.object({
    common: z.array(z.string()).optional(), // 共通のNGオプション
    others: z.array(z.string()).optional(), // その他のNGオプション
  }),

  // アレルギー
  hasAllergies: z.boolean(), // アレルギーの有無
  allergies: z.object({
    types: z.array(z.string()).optional(), // アレルギーの種類
    others: z.array(z.string()).optional(), // その他のアレルギー
  }),

  // 喫煙
  isSmoker: z.boolean(), // 喫煙の有無
  smoking: z.object({
    types: z.array(z.string()).optional(), // 喫煙の種類
    others: z.array(z.string()).optional(), // その他の喫煙情報
  }),

  // エステ関連
  hasEstheExperience: z.boolean(), // エステ経験の有無
  estheExperiencePeriod: z.string().optional(), // エステ経験期間
  estheOptions: z.object({
    available: z.array(z.string()).optional(), // 対応可能なエステメニュー
    ngOptions: z.array(z.string()).optional(), // NGのエステメニュー
  }).optional(),

  // SNS情報
  hasSnsAccount: z.boolean(), // SNSアカウントの有無
  snsUrls: z.array(z.string()).optional(), // SNSのURL

  // 店舗情報
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })).optional(), // 現在の在籍店舗
  previousStores: z.array(z.object({
    storeName: z.string(),
  })).optional(), // 過去の在籍店舗

  // PR・備考
  selfIntroduction: z.string().optional(), // 自己PR
  notes: z.string().optional(), // その他備考
});

export type ProfileData = z.infer<typeof profileSchema>;