import { useQuery, useMutation } from "@tanstack/react-query";
import { type TalentProfileData } from "@shared/schema";
import { queryClient, QUERY_KEYS, apiRequest } from "@/lib/queryClient";

export function useProfile() {
  // プロフィールデータを取得
  const profileQuery = useQuery({
    queryKey: [QUERY_KEYS.TALENT_PROFILE],
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30000, // 30秒間はキャッシュを使用
    placeholderData: {
      // 初期データを設定
      lastName: '',
      firstName: '',
      lastNameKana: '',
      firstNameKana: '',
      birthDate: '',
      age: 0,
      phoneNumber: '',
      email: '',
      location: '',
      nearestStation: '',
      height: 0,
      weight: 0,
      bust: 0,
      waist: 0,
      hip: 0,
      cupSize: '',
      availableIds: {
        types: [],
        others: [],
      },
      canProvideResidenceRecord: false,
      photoDiaryAllowed: false,
      faceVisibility: '',
      canHomeDelivery: false,
      ngOptions: {
        common: [],
        others: [],
      },
      hasAllergies: false,
      allergies: {
        types: [],
        others: [],
      },
      isSmoker: false,
      smoking: {
        types: [],
        others: [],
      },
      hasEstheExperience: false,
      estheExperiencePeriod: '',
      estheOptions: {
        available: [],
        ngOptions: [],
      },
      selfIntroduction: '',
      notes: '',
    } as TalentProfileData,
  });

  // プロフィール更新用のミューテーション
  const updateProfileMutation = useMutation({
    mutationFn: async (newData: Partial<TalentProfileData>) => {
      console.log('Updating profile with:', newData); // デバッグ用
      const response = await apiRequest("PATCH", QUERY_KEYS.TALENT_PROFILE, newData);
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // キャッシュを更新
      queryClient.setQueryData([QUERY_KEYS.TALENT_PROFILE], data);
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
    },
  });

  return {
    profileData: profileQuery.data as TalentProfileData,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending
  } as const;
}