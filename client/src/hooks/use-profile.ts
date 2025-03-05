import { useState } from 'react';
import { type ProfileData } from '@shared/types/profile';

export function useProfile() {
  const [profileData, setProfileData] = useState<ProfileData>({
    // 基本情報
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

    // 身体的特徴
    height: 0,
    weight: 0,
    bust: 0,
    waist: 0,
    hip: 0,
    cupSize: '',

    // 身分証明書
    availableIds: {
      types: [],
      others: [],
    },
    canProvideResidenceRecord: false,

    // 写真関連
    faceVisibility: '口だけ隠し',
    photoDiaryAllowed: false,

    // 自宅派遣関連
    canHomeDelivery: false,

    // NGオプション
    ngOptions: {
      common: [],
      others: [],
    },

    // アレルギー
    hasAllergies: false,
    allergies: {
      types: [],
      others: [],
    },

    // 喫煙
    isSmoker: false,
    smoking: {
      types: [],
      others: [],
    },

    // エステ関連
    hasEstheExperience: false,
    estheExperiencePeriod: '',
    estheOptions: {
      available: [],
      ngOptions: [],
    },

    // SNS情報
    hasSnsAccount: false,
    snsUrls: [],

    // 店舗情報
    currentStores: [],
    previousStores: [],

    // PR・備考
    selfIntroduction: '',
    notes: '',
  });

  const updateProfile = (newData: Partial<ProfileData>) => {
    console.log('Updating profile with:', newData); // デバッグ用
    setProfileData(prev => ({
      ...prev,
      ...newData,
      // ネストされたオブジェクトの更新を確実に行う
      availableIds: {
        ...prev.availableIds,
        ...(newData.availableIds || {}),
      },
      ngOptions: {
        ...prev.ngOptions,
        ...(newData.ngOptions || {}),
      },
      allergies: {
        ...prev.allergies,
        ...(newData.allergies || {}),
      },
      smoking: {
        ...prev.smoking,
        ...(newData.smoking || {}),
      },
      estheOptions: {
        ...prev.estheOptions,
        ...(newData.estheOptions || {}),
      },
    }));
  };

  return {
    profileData,
    updateProfile,
  } as const;
}