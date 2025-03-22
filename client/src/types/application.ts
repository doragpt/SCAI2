import { ServiceType } from "@shared/schema";

export interface Application {
  id: number;
  store_profile_id: number;
  user_id: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  message: string | null;
  created_at: string;
  updated_at: string;
  // 応募履歴取得APIから返される追加データ
  businessName?: string;
  location?: string;
  serviceType?: ServiceType;
  // 店舗向け一覧APIから返される追加データ
  username?: string;
}

export interface ApplicationFormData {
  message?: string;
}