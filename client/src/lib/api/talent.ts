import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('Fetching talent profile...');
    // クエリキーから正しいAPIパスを使用
    const data = await apiRequest<TalentProfileData | null>("GET", QUERY_KEYS.TALENT_PROFILE);
    console.log('Talent profile fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching talent profile:', error);
    
    // 404エラーのような「データが存在しない」系のエラーはnullとして扱う
    if (error instanceof Error && error.message.includes('見つかりません')) {
      console.log('Profile not found, returning null');
      return null;
    }
    
    throw error;
  }
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<TalentProfileData> {
  try {
    console.log('Updating talent profile with data:', data);
    // クエリキーから正しいAPIパスを使用
    const updatedProfile = await apiRequest<TalentProfileData>("POST", QUERY_KEYS.TALENT_PROFILE, data);
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