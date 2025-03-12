import { useQuery, useMutation } from "@tanstack/react-query";
import { type TalentProfileData } from "@shared/schema";
import { queryClient, QUERY_KEYS, apiRequest } from "@/lib/queryClient";

export function useProfile() {
  // プロフィールデータを取得
  const profileQuery = useQuery<TalentProfileData>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      console.log('Fetching profile data from API...');
      try {
        const response = await apiRequest<TalentProfileData>("GET", QUERY_KEYS.TALENT_PROFILE);
        console.log('Profile data received from API:', response);
        return response;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30000, // 30秒間はキャッシュを使用
  });

  // プロフィール更新用のミューテーション
  const updateProfileMutation = useMutation({
    mutationFn: async (newData: Partial<TalentProfileData>) => {
      console.log('Updating profile with:', {
        data: newData,
        timestamp: new Date().toISOString()
      });
      try {
        const response = await apiRequest<TalentProfileData>("PATCH", QUERY_KEYS.TALENT_PROFILE, newData);
        console.log('Profile update response:', response);
        return response;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // キャッシュを更新
      queryClient.setQueryData([QUERY_KEYS.TALENT_PROFILE], data);
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
    },
  });

  return {
    profileData: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    refetch: profileQuery.refetch
  } as const;
}