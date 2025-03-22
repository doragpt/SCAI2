import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('Fetching talent profile...');
    const data = await apiRequest("GET", "/api/talent/profile");
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
    const updatedProfile = await apiRequest("POST", "/api/talent/profile", data);
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