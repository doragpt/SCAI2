import { useQuery, useMutation } from "@tanstack/react-query";
import { type ProfileData } from "@shared/types/profile";
import { queryClient, QUERY_KEYS } from "@/lib/queryClient";

export function useProfile() {
  // プロフィールデータを取得
  const { data: profileData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    refetchOnWindowFocus: false,
  });

  // プロフィール更新用のミューテーション
  const updateProfileMutation = useMutation({
    mutationFn: async (newData: Partial<ProfileData>) => {
      const response = await fetch("/api/talent/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // キャッシュを更新
      queryClient.setQueryData([QUERY_KEYS.TALENT_PROFILE], data);
    },
  });

  const updateProfile = (newData: Partial<ProfileData>) => {
    console.log('Updating profile with:', newData); // デバッグ用
    updateProfileMutation.mutate(newData);
  };

  return {
    profileData,
    isLoading,
    updateProfile,
  } as const;
}