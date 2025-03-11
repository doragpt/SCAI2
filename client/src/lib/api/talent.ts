import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('Fetching talent profile:', {
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest("GET", "/api/talent/profile");

    console.log('Talent profile response:', {
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      // レスポンスがJSONでない場合のエラーハンドリング
      const errorData = await response.json().catch(() => ({
        message: `Server error: ${response.status} ${response.statusText}`
      }));
      throw new Error(errorData.message || "プロフィールの取得に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Profile fetch error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<void> {
  try {
    console.log('Updating talent profile:', {
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest("POST", "/api/talent/profile", data);

    console.log('Update profile response:', {
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Server error: ${response.status} ${response.statusText}`
      }));
      throw new Error(errorData.message || "プロフィールの保存に失敗しました");
    }
  } catch (error) {
    console.error("Profile update error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export function invalidateTalentProfileCache(queryClient: any) {
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}