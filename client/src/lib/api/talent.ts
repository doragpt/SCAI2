import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('Fetching talent profile...');
    // クエリキーから正しいAPIパスを使用
    const response = await apiRequest("GET", QUERY_KEYS.TALENT_PROFILE);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Talent profile API error:', errorData);
      throw new Error(errorData.message || 'プロフィール取得に失敗しました');
    }
    const data = await response.json();
    console.log('Talent profile fetched successfully:', data);
    return data as TalentProfileData;
  } catch (error) {
    console.error('Error fetching talent profile:', error);
    throw error;
  }
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<TalentProfileData> {
  try {
    console.log('Updating talent profile with data:', data);
    // クエリキーから正しいAPIパスを使用
    const response = await apiRequest("POST", QUERY_KEYS.TALENT_PROFILE, data);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Talent profile update error:', errorData);
      throw new Error(errorData.message || 'プロフィール更新に失敗しました');
    }
    const updatedProfile = await response.json();
    console.log('Talent profile updated successfully:', updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Error updating talent profile:', error);
    throw error;
  }
}

export function invalidateTalentProfileCache(queryClient: any) {
  console.log('Invalidating talent profile cache');
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}

export { apiRequest };