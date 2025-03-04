import { useState } from 'react';
import { type ProfileData } from '@shared/types/profile';

export function useProfile() {
  const [profileData, setProfileData] = useState<ProfileData>({
    availableIds: {
      types: ['運転免許証', '保険証'],
      others: [],
    },
    canProvideResidenceRecord: true,
    canPhotoDiary: true,
    canHomeDelivery: false,
    ngOptions: {
      common: ['ソフトSM', 'ハードサービス'],
      others: [],
    },
    allergies: {
      types: [],
      others: [],
    },
    smoking: {
      types: ['禁煙'],
      others: [],
    },
    estheOptions: {
      available: ['オイルマッサージ', 'アロママッサージ'],
      ngOptions: ['ディープリンパ'],
    },
  });

  const updateProfile = (newData: Partial<ProfileData>) => {
    setProfileData(prev => ({
      ...prev,
      ...newData,
    }));
  };

  return {
    profileData,
    updateProfile,
  } as const;
}