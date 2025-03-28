/**
 * データ型変換ユーティリティ
 * 
 * PostgreSQLのカラム型（JSONB/TEXT）とJavaScriptのデータ型（オブジェクト/配列/文字列）間の
 * 変換を一貫して行うためのユーティリティ関数群
 */

export const dataUtils = {
  /**
   * 値を配列として確保する
   * @param value 変換する値
   * @param defaultValue デフォルト値（解析失敗時）
   * @returns 配列
   */
  ensureArray: (value: any, defaultValue: any[] = []): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  },

  /**
   * 値をオブジェクトとして確保する
   * @param value 変換する値
   * @param defaultValue デフォルト値（解析失敗時）
   * @returns オブジェクト
   */
  ensureObject: (value: any, defaultValue: any = {}): any => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) 
          ? parsed 
          : defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  },

  /**
   * 値を文字列として確保する
   * @param value 変換する値
   * @param defaultValue デフォルト値（変換失敗時）
   * @returns 文字列
   */
  ensureString: (value: any, defaultValue: string = ""): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' || Array.isArray(value)) {
      try {
        return JSON.stringify(value);
      } catch {
        return defaultValue;
      }
    }
    return String(value);
  },

  /**
   * JSONB型用の配列処理
   * PostgreSQLでJSONB型カラムに保存する配列データを準備
   */
  prepareJsonbArray: (value: any): any[] => {
    return dataUtils.ensureArray(value);
  },

  /**
   * JSONB型用のオブジェクト処理
   * PostgreSQLでJSONB型カラムに保存するオブジェクトデータを準備
   */
  prepareJsonbObject: (value: any, defaultShape: any): any => {
    return dataUtils.ensureObject(value, defaultShape);
  },

  /**
   * TEXT型用のJSON文字列処理
   * PostgreSQLでTEXT型カラムに保存するJSON文字列データを準備
   */
  prepareTextJson: (value: any, defaultValue: string = '{}'): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return defaultValue;
    try {
      return JSON.stringify(value);
    } catch {
      return defaultValue;
    }
  },

  /**
   * デザイン設定のJSONB処理
   * design_settingsフィールドを処理し、JSONB型として正しく保存するための準備
   */
  processDesignSettings: (value: any): any => {
    // デザイン設定はオブジェクト型で処理
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        console.log('デザイン設定を文字列からJSONに変換しました', { 
          before: typeof value,
          after: typeof parsed,
          hasSections: parsed && parsed.sections && Array.isArray(parsed.sections)
        });
        
        // セクションが配列であることを確認し、必要な構造を持っているか検証
        if (parsed && typeof parsed === 'object' && parsed.sections) {
          if (!Array.isArray(parsed.sections)) {
            console.warn('デザイン設定のsectionsが配列ではありません。空配列で初期化します。');
            parsed.sections = [];
          }
          
          if (!parsed.globalSettings || typeof parsed.globalSettings !== 'object') {
            console.warn('デザイン設定のglobalSettingsが存在しないか、オブジェクトではありません。空オブジェクトで初期化します。');
            parsed.globalSettings = {};
          }
          
          return parsed;
        }
        
        return parsed;
      } catch (e) {
        console.error('デザイン設定の解析エラー:', e);
        return { sections: [], globalSettings: {} };
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // オブジェクトの場合は構造を検証
      if (!value.sections) {
        console.warn('デザイン設定のsectionsプロパティがありません。空配列で初期化します。');
        value.sections = [];
      } else if (!Array.isArray(value.sections)) {
        console.warn('デザイン設定のsectionsが配列ではありません。空配列で初期化します。');
        value.sections = [];
      }
      
      if (!value.globalSettings || typeof value.globalSettings !== 'object') {
        console.warn('デザイン設定のglobalSettingsが存在しないか、オブジェクトではありません。空オブジェクトで初期化します。');
        value.globalSettings = {};
      }
      
      return value;
    }
    
    console.warn('デザイン設定が無効な形式です。デフォルト設定を使用します。', { 
      type: typeof value, 
      valueProvided: value !== null && value !== undefined 
    });
    
    return { sections: [], globalSettings: {} };
  },

  /**
   * データ構造をログ出力
   * デバッグ用の詳細ログ
   */
  logDataStructure: (data: any, context: string): void => {
    if (!data) {
      console.log(`データ構造ログ (${context}): データが存在しません`);
      return;
    }

    console.log(`データ構造ログ (${context}):`, {
      timestamp: new Date().toISOString(),
      context,
      special_offers: data.special_offers ? {
        type: typeof data.special_offers,
        sample: typeof data.special_offers === 'string' 
          ? data.special_offers.substring(0, 50) + (data.special_offers.length > 50 ? '...' : '')
          : JSON.stringify(data.special_offers).substring(0, 50) + (JSON.stringify(data.special_offers).length > 50 ? '...' : ''),
        isValidJson: typeof data.special_offers === 'string' ? (() => {
          try {
            JSON.parse(data.special_offers);
            return true;
          } catch {
            return false;
          }
        })() : 'not string'
      } : 'undefined',
      gallery_photos: data.gallery_photos ? {
        type: typeof data.gallery_photos,
        isArray: Array.isArray(data.gallery_photos),
        length: Array.isArray(data.gallery_photos) ? data.gallery_photos.length : 'not array',
        sample: Array.isArray(data.gallery_photos) && data.gallery_photos.length > 0 
          ? JSON.stringify(data.gallery_photos[0]).substring(0, 50) + (JSON.stringify(data.gallery_photos[0]).length > 50 ? '...' : '')
          : 'empty or not array'
      } : 'undefined',
      requirements: data.requirements ? {
        type: typeof data.requirements,
        isObject: data.requirements && typeof data.requirements === 'object' && !Array.isArray(data.requirements),
        keys: data.requirements && typeof data.requirements === 'object' && !Array.isArray(data.requirements)
          ? Object.keys(data.requirements)
          : 'not object'
      } : 'undefined',
      design_settings: data.design_settings ? {
        type: typeof data.design_settings,
        isObject: data.design_settings && typeof data.design_settings === 'object' && !Array.isArray(data.design_settings),
        hasSections: data.design_settings && 
          typeof data.design_settings === 'object' && 
          !Array.isArray(data.design_settings) && 
          'sections' in data.design_settings,
        sectionsCount: data.design_settings && 
          typeof data.design_settings === 'object' && 
          !Array.isArray(data.design_settings) && 
          'sections' in data.design_settings &&
          Array.isArray(data.design_settings.sections) 
            ? data.design_settings.sections.length 
            : 'not array'
      } : 'undefined'
    });
  }
};

// デフォルトの要件オブジェクト
export const DEFAULT_REQUIREMENTS = {
  cup_size_conditions: [],
  accepts_temporary_workers: true,
  requires_arrival_day_before: false,
  prioritize_titles: false,
  other_conditions: []
};