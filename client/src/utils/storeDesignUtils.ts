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
  
  // requirementsフィールドの処理（配列を想定）
  if (profile.requirements) {
    try {
      // オブジェクトが渡された場合（APIのJSONB型は配列を想定）
      if (typeof profile.requirements === 'object' && !Array.isArray(profile.requirements)) {
        console.warn('フィールド requirements は配列であるべきですが、配列ではありません。空配列を使用します。');
        processedProfile.requirements = [];
      }
      // 文字列の場合はパースを試みる
      else if (typeof profile.requirements === 'string') {
        try {
          const parsed = JSON.parse(profile.requirements);
          processedProfile.requirements = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('requirements文字列のパースに失敗しました', e);
          processedProfile.requirements = [];
        }
      }
    } catch (e) {
      console.error('requirementsフィールドの処理中にエラーが発生しました', e);
      processedProfile.requirements = [];
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
          .filter(item => item !== null && item !== undefined)
          .map(item => typeof item === 'string' ? item : String(item));
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
  
  return processedProfile;
}