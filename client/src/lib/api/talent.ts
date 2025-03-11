import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    const response = await apiRequest("GET", "/api/talent/profile");
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "プロフィールの取得に失敗しました");
    }
    return response.json();
  } catch (error) {
    console.error("Profile fetch error:", error);
    throw error;
  }
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<void> {
  try {
    const response = await apiRequest("POST", "/api/talent/profile", data);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "プロフィールの保存に失敗しました");
    }
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
}

export function invalidateTalentProfileCache(queryClient: any) {
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}