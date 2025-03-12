import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('Fetching talent profile...');
    const response = await apiRequest("GET", "/api/talent/profile");

    if (response.status === 404) {
      console.log('Profile not found, this is normal for new users');
      return null;
    }

    if (response.status === 401) {
      console.log('Unauthorized access to talent profile');
      throw new Error("認証が必要です");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "プロフィールの取得に失敗しました");
    }

    const data = await response.json();
    console.log('Talent profile fetched successfully:', data);
    return data as TalentProfileData;
  } catch (error) {
    console.error('Error fetching talent profile:', error);
    throw error;
  }
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<void> {
  try {
    console.log('Updating talent profile with data:', data);
    const response = await apiRequest("POST", "/api/talent/profile", data);

    if (response.status === 401) {
      throw new Error("認証が必要です");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "プロフィールの保存に失敗しました");
    }

    console.log('Talent profile updated successfully');
  } catch (error) {
    console.error('Error updating talent profile:', error);
    throw error;
  }
}

export function invalidateTalentProfileCache(queryClient: any) {
  console.log('Invalidating talent profile cache');
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}