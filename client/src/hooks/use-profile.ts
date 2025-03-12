import { useQuery, useMutation } from "@tanstack/react-query";
import { type TalentProfileData } from "@shared/schema";
import { queryClient, QUERY_KEYS } from "@/lib/queryClient";
import { getTalentProfile, createOrUpdateTalentProfile, invalidateTalentProfileCache } from "@/lib/api/talent";

export function useProfile() {
  // プロフィールデータを取得
  const profileQuery = useQuery<TalentProfileData | null>({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    queryFn: async () => {
      console.log('Fetching profile data from API...');
      try {
        const data = await getTalentProfile();
        console.log('Profile data received:', data);
        return data;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 0, // キャッシュを無効化して常に最新のデータを取得
  });

  // プロフィール更新用のミューテーション
  const updateProfileMutation = useMutation({
    mutationFn: async (newData: Partial<TalentProfileData>) => {
      console.log('Updating profile with:', {
        data: newData,
        timestamp: new Date().toISOString()
      });
      try {
        await createOrUpdateTalentProfile(newData as TalentProfileData);
        return newData;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // キャッシュを更新
      queryClient.setQueryData([QUERY_KEYS.TALENT_PROFILE], data);
      // キャッシュを無効化して再取得を強制
      invalidateTalentProfileCache(queryClient);
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