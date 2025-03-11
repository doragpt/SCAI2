import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData> {
  const response = await apiRequest("GET", "/api/talent/profile");
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "プロフィールの取得に失敗しました");
  }
  return response.json();
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<void> {
  const response = await apiRequest("POST", "/api/talent/profile", data);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "プロフィールの保存に失敗しました");
  }
}

export function invalidateTalentProfileCache(queryClient: any) {
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}