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

    console.log('Talent profile API response:', {
      hasData: !!response,
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

export const createOrUpdateTalentProfile = async (data: TalentProfileData): Promise<TalentProfileData> => {
  try {
    const method = data.id ? "PUT" : "POST";
    const response = await apiRequest<TalentProfileData>(
      method,
      QUERY_KEYS.TALENT_PROFILE,
      data
    );
    return response;
  } catch (error) {
    console.error("Talent profile update error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const invalidateTalentProfileCache = () => {
  const queryClient = useQueryClient();
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
};