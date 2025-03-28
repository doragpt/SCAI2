/**
 * storeDesignUtils.ts
 * 
 * ストアのデザイン設定に関するユーティリティ関数を提供する
 * JSONB型と通常のJavaScript型の変換や、特殊なセクション設定の処理を行う
 */

import { 
  DesignSettings, 
  DesignSection, 
  GlobalDesignSettings,
  SectionSettings,
  StoreProfile
} from '../../../shared/schema';
import { getDefaultDesignSettings } from '../shared/defaultDesignSettings';
import { processJsonField, ensureArray, convertToJsonB } from '../utils/dataTypeUtils';

/**
 * デザイン設定をデータベースから読み込んで適切な形式に変換する
 * 
 * @param designSettingsData データベースから取得したJSONB形式のデザイン設定
 * @returns 適切に処理されたデザイン設定オブジェクト
 */
export function processDesignSettings(designSettingsData: unknown): DesignSettings {
  // データが存在しない場合はデフォルト設定を返す
  if (!designSettingsData) {
    return getDefaultDesignSettings();
  }

  try {
    // 文字列の場合はJSONとしてパース
    const parsedData = typeof designSettingsData === 'string'
      ? JSON.parse(designSettingsData)
      : designSettingsData;

    // null または undefined の場合はデフォルト設定を返す
    if (!parsedData) {
      return getDefaultDesignSettings();
    }

    // オブジェクトでない場合はデフォルト設定を返す
    if (typeof parsedData !== 'object') {
      console.warn('デザイン設定が不正な形式です:', parsedData);
      return getDefaultDesignSettings();
    }

    const defaultSettings = getDefaultDesignSettings();
    
    // セクションとグローバル設定を確認し、必要に応じてデフォルト値でマージ
    const settings: DesignSettings = {
      globalSettings: processGlobalSettings(parsedData.globalSettings, defaultSettings.globalSettings),
      sections: processSections(parsedData.sections, defaultSettings.sections)
    };

    return settings;

  } catch (error) {
    console.error('デザイン設定の処理中にエラーが発生しました:', error);
    return getDefaultDesignSettings();
  }
}

/**
 * グローバル設定を処理する
 */
function processGlobalSettings(settings: unknown, defaultSettings: GlobalDesignSettings): GlobalDesignSettings {
  if (!settings || typeof settings !== 'object') {
    return defaultSettings;
  }

  // 型アサーション - この時点でオブジェクトであることは確認済み
  const settingsObj = settings as Record<string, unknown>;

  return {
    mainColor: typeof settingsObj.mainColor === 'string' ? settingsObj.mainColor : defaultSettings.mainColor,
    secondaryColor: typeof settingsObj.secondaryColor === 'string' ? settingsObj.secondaryColor : defaultSettings.secondaryColor,
    accentColor: typeof settingsObj.accentColor === 'string' ? settingsObj.accentColor : defaultSettings.accentColor,
    backgroundColor: typeof settingsObj.backgroundColor === 'string' ? settingsObj.backgroundColor : defaultSettings.backgroundColor,
    fontFamily: typeof settingsObj.fontFamily === 'string' ? settingsObj.fontFamily : defaultSettings.fontFamily,
    borderRadius: typeof settingsObj.borderRadius === 'number' ? settingsObj.borderRadius : defaultSettings.borderRadius,
    maxWidth: typeof settingsObj.maxWidth === 'number' ? settingsObj.maxWidth : defaultSettings.maxWidth,
    hideSectionTitles: typeof settingsObj.hideSectionTitles === 'boolean' ? settingsObj.hideSectionTitles : defaultSettings.hideSectionTitles,
  };
}

/**
 * セクションの配列を処理する
 */
function processSections(sections: unknown, defaultSections: DesignSection[]): DesignSection[] {
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return defaultSections;
  }

  // 各セクションID用のデフォルトセクションのマップを作成
  const defaultSectionsMap = new Map<string, DesignSection>();
  defaultSections.forEach(section => {
    defaultSectionsMap.set(section.id, section);
  });

  // 各セクションを処理
  return sections.map(section => {
    if (!section || typeof section !== 'object') {
      throw new Error('セクションの形式が不正です');
    }

    // 型アサーション
    const sectionObj = section as Record<string, unknown>;
    const id = typeof sectionObj.id === 'string' ? sectionObj.id : '';
    
    if (!id) {
      throw new Error('セクションIDが不正です');
    }

    // このIDのデフォルトセクションを取得
    const defaultSection = defaultSectionsMap.get(id);
    if (!defaultSection) {
      // IDに対応するデフォルトセクションがない場合は、与えられたセクションをそのまま使用
      return {
        id,
        title: typeof sectionObj.title === 'string' ? sectionObj.title : id,
        order: typeof sectionObj.order === 'number' ? sectionObj.order : 0,
        visible: typeof sectionObj.visible === 'boolean' ? sectionObj.visible : true,
        settings: processSectionSettings(sectionObj.settings, {} as SectionSettings)
      };
    }

    // デフォルトセクションとマージ
    return {
      id,
      title: typeof sectionObj.title === 'string' ? sectionObj.title : defaultSection.title,
      order: typeof sectionObj.order === 'number' ? sectionObj.order : defaultSection.order,
      visible: typeof sectionObj.visible === 'boolean' ? sectionObj.visible : defaultSection.visible,
      settings: processSectionSettings(sectionObj.settings, defaultSection.settings || {})
    };
  });
}

/**
 * セクション設定を処理する
 */
function processSectionSettings(settings: unknown, defaultSettings: SectionSettings): SectionSettings {
  if (!settings || typeof settings !== 'object') {
    return defaultSettings;
  }

  // 型アサーション
  const settingsObj = settings as Record<string, unknown>;

  // 基本設定
  const processedSettings: SectionSettings = {
    backgroundColor: typeof settingsObj.backgroundColor === 'string' ? settingsObj.backgroundColor : defaultSettings.backgroundColor,
    textColor: typeof settingsObj.textColor === 'string' ? settingsObj.textColor : defaultSettings.textColor,
    borderColor: typeof settingsObj.borderColor === 'string' ? settingsObj.borderColor : defaultSettings.borderColor,
    titleColor: typeof settingsObj.titleColor === 'string' ? settingsObj.titleColor : defaultSettings.titleColor,
    fontSize: typeof settingsObj.fontSize === 'number' ? settingsObj.fontSize : defaultSettings.fontSize,
    padding: typeof settingsObj.padding === 'number' ? settingsObj.padding : defaultSettings.padding,
    borderRadius: typeof settingsObj.borderRadius === 'number' ? settingsObj.borderRadius : defaultSettings.borderRadius,
    borderWidth: typeof settingsObj.borderWidth === 'number' ? settingsObj.borderWidth : defaultSettings.borderWidth,
  };

  // 特殊設定（セクションタイプに応じた設定）
  if (typeof settingsObj.accentColor === 'string') {
    processedSettings.accentColor = settingsObj.accentColor;
  } else if (defaultSettings.accentColor) {
    processedSettings.accentColor = defaultSettings.accentColor;
  }

  if (typeof settingsObj.fixed === 'boolean') {
    processedSettings.fixed = settingsObj.fixed;
  } else if (defaultSettings.fixed !== undefined) {
    processedSettings.fixed = defaultSettings.fixed;
  }

  if (typeof settingsObj.logoWidth === 'number') {
    processedSettings.logoWidth = settingsObj.logoWidth;
  } else if (defaultSettings.logoWidth !== undefined) {
    processedSettings.logoWidth = defaultSettings.logoWidth;
  }

  if (typeof settingsObj.height === 'number') {
    processedSettings.height = settingsObj.height;
  } else if (defaultSettings.height !== undefined) {
    processedSettings.height = defaultSettings.height;
  }

  if (typeof settingsObj.imageUrl === 'string') {
    processedSettings.imageUrl = settingsObj.imageUrl;
  } else if (defaultSettings.imageUrl !== undefined) {
    processedSettings.imageUrl = defaultSettings.imageUrl;
  }

  if (typeof settingsObj.titleText === 'string') {
    processedSettings.titleText = settingsObj.titleText;
  } else if (defaultSettings.titleText !== undefined) {
    processedSettings.titleText = defaultSettings.titleText;
  }

  if (typeof settingsObj.overlayColor === 'string') {
    processedSettings.overlayColor = settingsObj.overlayColor;
  } else if (defaultSettings.overlayColor !== undefined) {
    processedSettings.overlayColor = defaultSettings.overlayColor;
  }

  if (typeof settingsObj.columnCount === 'number') {
    processedSettings.columnCount = settingsObj.columnCount;
  } else if (defaultSettings.columnCount !== undefined) {
    processedSettings.columnCount = defaultSettings.columnCount;
  }

  if (typeof settingsObj.postsToShow === 'number') {
    processedSettings.postsToShow = settingsObj.postsToShow;
  } else if (defaultSettings.postsToShow !== undefined) {
    processedSettings.postsToShow = defaultSettings.postsToShow;
  }

  if (typeof settingsObj.itemsToShow === 'number') {
    processedSettings.itemsToShow = settingsObj.itemsToShow;
  } else if (defaultSettings.itemsToShow !== undefined) {
    processedSettings.itemsToShow = defaultSettings.itemsToShow;
  }

  return processedSettings;
}

/**
 * デザイン設定をデータベースに保存するための形式に変換する
 * 
 * @param designSettings フロントエンドで使用されているデザイン設定
 * @returns データベースに保存可能な形式のデザイン設定
 */
export function prepareDesignSettingsForDatabase(designSettings: DesignSettings): unknown {
  try {
    // PostgreSQLのJSONB型に保存するための適切な形式に変換
    console.log('デザイン設定を保存形式に変換します', {
      type: typeof designSettings,
      hasGlobalSettings: designSettings && designSettings.globalSettings,
      hasSections: designSettings && designSettings.sections && Array.isArray(designSettings.sections)
    });
    
    // データがオブジェクトで要素があることを確認
    if (!designSettings || typeof designSettings !== 'object') {
      console.error('無効なデザイン設定形式です', designSettings);
      return null;
    }
    
    // このオブジェクトをデータベースに保存できる形式に変換
    return convertToJsonB(designSettings);
  } catch (error) {
    console.error('デザイン設定のデータベース保存準備でエラーが発生しました:', error);
    // エラーの場合はnullを返す（API側でバリデーションが必要）
    return null;
  }
}

/**
 * 特定のセクションのデフォルト設定を取得する
 * 
 * @param sectionId セクションID
 * @returns デフォルトのセクション設定、存在しない場合はnull
 */
export function getDefaultSectionById(sectionId: string): DesignSection | null {
  const defaultSettings = getDefaultDesignSettings();
  return defaultSettings.sections.find(section => section.id === sectionId) || null;
}

/**
 * 特定のセクションの設定をリセットする
 * 
 * @param settings 現在のデザイン設定
 * @param sectionId リセットするセクションのID
 * @returns 更新されたデザイン設定
 */
export function resetSectionToDefault(settings: DesignSettings, sectionId: string): DesignSettings {
  const defaultSection = getDefaultSectionById(sectionId);
  if (!defaultSection) {
    return settings;
  }

  // 指定されたセクションをデフォルト値に置き換えた新しい設定を返す
  return {
    ...settings,
    sections: settings.sections.map(section => 
      section.id === sectionId ? defaultSection : section
    )
  };
}

/**
 * セクションIDからタイトルを取得する
 * 
 * @param sectionId セクションのID
 * @returns 表示用のタイトル
 */
export function getSectionTitle(sectionId: string): string {
  const sectionTitles: Record<string, string> = {
    'header': 'ヘッダー',
    'hero': 'メインビジュアル',
    'about': '店舗紹介',
    'features': '特徴・強み',
    'benefits': '待遇・福利厚生',
    'gallery': 'ギャラリー',
    'testimonials': '体験談・口コミ',
    'requirements': '募集要項',
    'faq': 'よくある質問',
    'contact': 'お問い合わせ',
    'recruiter': '採用担当者',
    'location': 'アクセス・地図',
    'campaign': 'キャンペーン',
    'blog': 'ブログ記事',
    'statistics': '実績データ',
    'schedule': '出勤スケジュール',
    'welcome': '新人歓迎',
    'experience': '体験入店案内',
    'security': 'セキュリティ対策',
    'payment': '給与・報酬',
    'cta': '応募ボタン',
    'footer': 'フッター'
  };
  
  return sectionTitles[sectionId] || sectionId;
}

/**
 * 必須セクションを含む設定を確保する
 * 
 * @param settings 現在のデザイン設定
 * @returns 必須セクションを含む設定
 */
export function ensureRequiredSections(settings: DesignSettings): DesignSettings {
  if (!settings) {
    return getDefaultDesignSettings();
  }
  
  // 必須セクションのID
  const requiredSectionIds = ['header', 'catchphrase', 'photo_gallery', 'benefits', 'salary', 'schedule', 'special_offers', 'access', 'contact', 'sns_links', 'security_measures', 'requirements', 'blog', 'footer'];
  
  // デフォルト設定
  const defaultSettings = getDefaultDesignSettings();
  const defaultSections = defaultSettings.sections;
  
  // 現在のセクションIDのセット
  const currentSectionIds = new Set(settings.sections.map(s => s.id));
  
  // 必須セクションが不足している場合は追加
  const additionalSections = [];
  for (const id of requiredSectionIds) {
    if (!currentSectionIds.has(id)) {
      const defaultSection = defaultSections.find(s => s.id === id);
      if (defaultSection) {
        additionalSections.push(defaultSection);
      }
    }
  }
  
  if (additionalSections.length === 0) {
    return settings;
  }
  
  // 必須セクションを追加した新しい設定を返す
  return {
    ...settings,
    sections: [
      ...settings.sections,
      ...additionalSections
    ]
  };
}

/**
 * 店舗プロフィールのJSONフィールドを処理する
 * 
 * @param profileData 店舗プロフィールデータ
 * @returns JSONフィールドが処理された店舗プロフィール
 */
export function processProfileJsonFields(profileData: any): any {
  if (!profileData) {
    return null;
  }
  
  try {
    // 新しいdataTypeUtilsを使用して各フィールドを処理
    const processedProfile = {
      ...profileData,
    };
    
    // ギャラリー写真の処理
    if ('gallery_photos' in profileData) {
      processedProfile.gallery_photos = processJsonField(profileData.gallery_photos, [], true);
    }
    
    // 特別オファーの処理
    if ('special_offers' in profileData) {
      processedProfile.special_offers = processJsonField(profileData.special_offers, [], true);
    }
    
    // 応募条件の処理
    if ('requirements' in profileData) {
      processedProfile.requirements = processJsonField(profileData.requirements, {});
    }
    
    // デザイン設定の処理
    if ('design_settings' in profileData) {
      processedProfile.design_settings = processDesignSettings(profileData.design_settings);
    }
    
    // プライバシー対策の処理 (string[] or string)
    if ('privacy_measures' in profileData) {
      processedProfile.privacy_measures = processJsonField(profileData.privacy_measures, [], true);
    }
    
    // セキュリティ対策の処理 (string[] or object[])
    if ('security_measures' in profileData) {
      processedProfile.security_measures = processJsonField(profileData.security_measures, [], true);
    }
    
    // コミットメント（取り組み）の処理
    if ('commitment' in profileData) {
      processedProfile.commitment = processJsonField(profileData.commitment, '');
    }
    
    // 給与例の処理
    if ('salary_examples' in profileData) {
      processedProfile.salary_examples = processJsonField(profileData.salary_examples, [], true);
    }
    
    // 勤務時間情報の処理
    if ('working_hours' in profileData) {
      processedProfile.working_hours = processJsonField(profileData.working_hours, {});
    }
    
    // 求人動画の処理
    if ('job_videos' in profileData) {
      processedProfile.job_videos = processJsonField(profileData.job_videos, [], true);
    }
    
    // 施設・設備の特徴
    if ('facility_features' in profileData) {
      processedProfile.facility_features = processJsonField(profileData.facility_features, [], true);
    }
    
    // SNSリンク
    if ('sns_links' in profileData) {
      processedProfile.sns_links = processJsonField(profileData.sns_links, [], true);
    }
    
    // SNS URL
    if ('sns_urls' in profileData) {
      processedProfile.sns_urls = processJsonField(profileData.sns_urls, [], true);
    }
    
    // 体験談・口コミ
    if ('testimonials' in profileData) {
      processedProfile.testimonials = processJsonField(profileData.testimonials, [], true);
    }
    
    // ブログ記事
    if ('blog_posts' in profileData) {
      processedProfile.blog_posts = processJsonField(profileData.blog_posts, [], true);
    }
    
    // 電話番号（配列）
    if ('phone_numbers' in profileData) {
      processedProfile.phone_numbers = ensureArray(profileData.phone_numbers);
    }
    
    // メールアドレス（配列）
    if ('email_addresses' in profileData) {
      processedProfile.email_addresses = ensureArray(profileData.email_addresses);
    }
    
    // デバッグ出力
    console.log('処理済みプロフィールデータ:', {
      special_offers: processedProfile.special_offers,
      requirements: processedProfile.requirements,
      security_measures: processedProfile.security_measures,
      privacy_measures: processedProfile.privacy_measures
    });
    
    return processedProfile;
  } catch (error) {
    console.error('プロフィールデータの処理中にエラーが発生しました:', error);
    return profileData;
  }
}