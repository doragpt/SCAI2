import { useState } from 'react';

interface ProfileData {
  availableIds?: {
    types?: string[];
    others?: string[];
  };
  canProvideResidenceRecord?: boolean;
  canPhotoDiary?: boolean;
  canHomeDelivery?: boolean;
  ngOptions: {
    common?: string[];
    others?: string[];
  };
  allergies: {
    types?: string[];
    others?: string[];
  };
  smoking: {
    types?: string[];
    others?: string[];
  };
  estheOptions?: {
    available?: string[];
    ngOptions?: string[];
  };
}

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
  };
}
