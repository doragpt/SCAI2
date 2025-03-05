import { useState } from 'react';
import { type ProfileData } from '@shared/types/profile';

export function useProfile() {
  const [profileData, setProfileData] = useState<ProfileData>({
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
    hasEstheExperience: false,
    estheExperiencePeriod: '',
    faceVisibility: '顔出しNG',
    hasSnsAccount: false,
    snsUrls: [],
    currentStores: [],
    previousStores: [],
    selfIntroduction: '',
    notes: '',
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