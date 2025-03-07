import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

export const getTalentProfileQuery = async (): Promise<TalentProfileData> => {
  try {
    console.log('Fetching talent profile:', {
      endpoint: QUERY_KEYS.TALENT_PROFILE,
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest<TalentProfileData>("GET", QUERY_KEYS.TALENT_PROFILE);

    console.log('Talent profile fetched successfully:', {
      hasData: !!response,
      profileData: JSON.stringify(response), // 完全なレスポンスデータをログに出力
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error("Talent profile fetch error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};