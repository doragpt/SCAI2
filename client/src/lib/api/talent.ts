import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

export const getTalentProfileQuery = async (): Promise<TalentProfileData> => {
  try {
    console.log('Fetching talent profile:', {
      endpoint: QUERY_KEYS.TALENT_PROFILE,
      token: !!localStorage.getItem("auth_token"),
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest<TalentProfileData>("GET", QUERY_KEYS.TALENT_PROFILE);

    console.log('Talent profile API response:', {
      hasData: !!response,
      responseData: JSON.stringify(response),
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

// キャッシュの更新や再取得のためのユーティリティ関数
export const invalidateTalentProfileCache = () => {
  const queryClient = useQueryClient();
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
};