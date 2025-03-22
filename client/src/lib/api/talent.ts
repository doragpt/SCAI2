import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('Fetching talent profile...');
    // クエリキーから正しいAPIパスを使用
    const data = await apiRequest("GET", QUERY_KEYS.TALENT_PROFILE);
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
    const updatedProfile = await apiRequest("POST", QUERY_KEYS.TALENT_PROFILE, data);
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