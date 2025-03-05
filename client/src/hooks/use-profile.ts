import { useQuery, useMutation } from "@tanstack/react-query";
import { type TalentProfileData } from "@shared/schema";
import { queryClient, QUERY_KEYS, apiRequest, updateTalentProfile } from "@/lib/queryClient";

export function useProfile() {
  // プロフィールデータを取得
  const profileQuery = useQuery({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // プロフィール更新用のミューテーション
  const updateProfileMutation = useMutation({
    mutationFn: updateTalentProfile,
    onSuccess: (data) => {
      // キャッシュを更新
      queryClient.setQueryData([QUERY_KEYS.TALENT_PROFILE], data);
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
    },
  });

  return {
    profileData: profileQuery.data as TalentProfileData | undefined,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending
  } as const;
}