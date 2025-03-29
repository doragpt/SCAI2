import { type DesignSettings, type DesignSection } from '@shared/schema';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';

/**
 * セクションIDからタイトルを取得する関数
 * @param id セクションID
 */
export function getSectionTitle(id: string): string {
  const sectionTitles: Record<string, string> = {
    'header': 'ヘッダー',
    'main_visual': 'メインビジュアル',
    'intro': '紹介文',
    'benefits': '待遇・メリット',
    'work_environment': '職場環境',
    'requirements': '応募条件',
    'application_info': '応募方法',
    'faq': 'よくある質問',
    'gallery': 'ギャラリー',
    'blog': 'ブログ',
    'news': 'お知らせ',
    'campaign': 'キャンペーン',
    'experience': '体験入店',
    'footer': 'フッター'
  };

  return sectionTitles[id] || `セクション: ${id}`;
}

/**
 * 必須セクションがない場合にデフォルト設定を追加する関数
 * @param settings 現在のデザイン設定
 */
export function ensureRequiredSections(settings: DesignSettings): DesignSettings {
  if (!settings) return getDefaultDesignSettings();
  
  // 設定のコピーを作成
  const processedSettings: DesignSettings = {
    globalSettings: { ...settings.globalSettings },
    sections: [...settings.sections]
  };
  
  // 必須セクションのリスト
  const requiredSections = ['main_visual', 'intro', 'footer'];
  
  // 必須セクションの存在確認
  requiredSections.forEach(sectionId => {
    const sectionExists = processedSettings.sections.some(section => section.id === sectionId);
    
    if (!sectionExists) {
      console.warn(`必須セクション: ${sectionId} が見つかりません。デフォルト設定を追加します。`);
      
      // デフォルト設定からセクションを取得
      const defaultSettings = getDefaultDesignSettings();
      const defaultSection = defaultSettings.sections.find(section => section.id === sectionId);
      
      if (defaultSection) {
        // デフォルトセクションを追加
        processedSettings.sections.push({
          ...defaultSection,
          // 順序を調整（既存のセクションの後ろに追加）
          order: Math.max(...processedSettings.sections.map(s => s.order), 0) + 1
        });
      }
    }
  });
  
  return processedSettings;
}

/**
 * デザイン設定の整合性を確保する関数
 * @param settings 現在のデザイン設定
 */
export function sanitizeDesignSettings(settings: DesignSettings): DesignSettings {
  if (!settings) return getDefaultDesignSettings();
  
  // 設定のコピーを作成
  const processedSettings: DesignSettings = {
    globalSettings: { ...settings.globalSettings },
    sections: [...settings.sections]
  };
  
  // グローバル設定がない場合はデフォルト値を使用
  if (!processedSettings.globalSettings) {
    processedSettings.globalSettings = getDefaultDesignSettings().globalSettings;
  }
  
  // セクションがない場合は空配列を使用
  if (!Array.isArray(processedSettings.sections)) {
    processedSettings.sections = [];
  }
  
  return ensureRequiredSections(processedSettings);
}

/**
 * プロフィールデータ内のJSONB型フィールドを処理する関数
 * @param profile 店舗プロフィール
 */
export function processProfileJsonFields(profile: any): any {
  if (!profile) return null;
  
  // 処理済みデータを格納するオブジェクト
  const processedProfile = { ...profile };
  
  // requirementsフィールドの処理（オブジェクトまたは配列を想定）
  if (profile.requirements) {
    try {
      // オブジェクトの場合はそのまま使用（APIはJSONB型としてオブジェクト形式で格納）
      if (typeof profile.requirements === 'object' && !Array.isArray(profile.requirements)) {
        // そのまま使用（オブジェクトは有効な形式）
        console.log('requirementsはオブジェクト形式です。', {
          keys: Object.keys(profile.requirements)
        });
      }
      // 文字列の場合はJSONパースを試みる
      else if (typeof profile.requirements === 'string') {
        try {
          const parsed = JSON.parse(profile.requirements);
          // パースした結果がオブジェクトならそのまま使用
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            processedProfile.requirements = parsed;
          } 
          // 配列の場合は特別処理（本来はオブジェクトを想定）
          else if (Array.isArray(parsed)) {
            console.warn('requirementsが配列形式です。この形式は想定外ですが対応します。');
            // 配列の場合は適切なオブジェクト構造に変換
            processedProfile.requirements = {
              age_min: 18,
              spec_min: 0,
              other_conditions: parsed,
              tattoo_acceptance: '',
              cup_size_conditions: [],
              preferred_look_types: [],
              preferred_hair_colors: [],
              accepts_temporary_workers: false,
              requires_arrival_day_before: false
            };
          } else {
            // その他の場合はデフォルト値
            processedProfile.requirements = {
              age_min: 18,
              spec_min: 0,
              other_conditions: [],
              tattoo_acceptance: '',
              cup_size_conditions: [],
              preferred_look_types: [],
              preferred_hair_colors: [],
              accepts_temporary_workers: false,
              requires_arrival_day_before: false
            };
          }
        } catch (e) {
          console.warn('requirements文字列のJSONパースに失敗しました', e);
          processedProfile.requirements = {
            age_min: 18,
            spec_min: 0,
            other_conditions: [],
            tattoo_acceptance: '',
            cup_size_conditions: [],
            preferred_look_types: [],
            preferred_hair_colors: [],
            accepts_temporary_workers: false,
            requires_arrival_day_before: false
          };
        }
      }
    } catch (e) {
      console.error('requirementsフィールドの処理中にエラーが発生しました', e);
      processedProfile.requirements = {
        age_min: 18,
        spec_min: 0,
        other_conditions: [],
        tattoo_acceptance: '',
        cup_size_conditions: [],
        preferred_look_types: [],
        preferred_hair_colors: [],
        accepts_temporary_workers: false,
        requires_arrival_day_before: false
      };
    }
  }
  
  // security_measuresフィールドの処理（配列を想定）
  if (profile.security_measures) {
    try {
      // 配列の場合はそのまま使用
      if (Array.isArray(profile.security_measures)) {
        // 何もしない
      }
      // 文字列の場合はJSON解析を試みる
      else if (typeof profile.security_measures === 'string') {
        try {
          const parsed = JSON.parse(profile.security_measures);
          processedProfile.security_measures = Array.isArray(parsed) ? parsed : [profile.security_measures];
        } catch (e) {
          console.warn('JSON文字列のパースに失敗しました', { 
            value: profile.security_measures,
            error: e
          });
          // JSONとして解析できない場合は、単一の文字列として配列に変換
          processedProfile.security_measures = [profile.security_measures];
        }
      }
      // その他の型の場合は空配列
      else {
        console.warn('フィールド security_measures は配列であるべきですが、配列ではありません。空配列を使用します。');
        processedProfile.security_measures = [];
      }
    } catch (e) {
      console.error('security_measuresフィールドの処理中にエラーが発生しました', e);
      processedProfile.security_measures = [];
    }
  }
  
  // privacy_measuresフィールドの処理（配列を想定）
  if (profile.privacy_measures) {
    try {
      // 配列の場合はそのまま使用
      if (Array.isArray(profile.privacy_measures)) {
        // 各要素が文字列であることを確認
        processedProfile.privacy_measures = profile.privacy_measures
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any) => typeof item === 'string' ? item : String(item));
      }
      // 文字列の場合はJSON解析を試みる
      else if (typeof profile.privacy_measures === 'string') {
        try {
          const parsed = JSON.parse(profile.privacy_measures);
          processedProfile.privacy_measures = Array.isArray(parsed) ? parsed : [profile.privacy_measures];
        } catch (e) {
          // JSONとして解析できない場合は、単一の文字列として配列に変換
          processedProfile.privacy_measures = [profile.privacy_measures];
        }
      }
      // その他の型の場合は文字列変換して配列に
      else {
        processedProfile.privacy_measures = [String(profile.privacy_measures)];
      }
    } catch (e) {
      console.error('privacy_measuresフィールドの処理中にエラーが発生しました', e);
      processedProfile.privacy_measures = [];
    }
  }
  
  // special_offersフィールドの処理（特別なオファー情報、JSONBとして保存）
  if (profile.special_offers) {
    try {
      // オブジェクトの場合はそのまま使用
      if (typeof profile.special_offers === 'object' && !Array.isArray(profile.special_offers)) {
        // そのまま使用（オブジェクトは有効な形式）
        console.log('special_offersはオブジェクト形式です。', {
          keys: Object.keys(profile.special_offers)
        });
      }
      // 文字列の場合はJSONパースを試みる
      else if (typeof profile.special_offers === 'string') {
        try {
          const parsed = JSON.parse(profile.special_offers);
          processedProfile.special_offers = parsed;
        } catch (e) {
          console.warn('special_offers文字列のJSONパースに失敗しました', e);
          processedProfile.special_offers = {};
        }
      }
    } catch (e) {
      console.error('special_offersフィールドの処理中にエラーが発生しました', e);
      processedProfile.special_offers = {};
    }
  }
  
  return processedProfile;
}