/**
 * データ型を処理するユーティリティ関数群
 * テキスト型とJSONB型の間の変換を一貫して行う
 */
export const dataUtils = {
  /**
   * テキスト型からJSONBへ、またはその逆の変換を行う
   * @param value 変換対象の値
   * @returns 変換後の値
   */
  convertJsonValue(value: any): any {
    // nullやundefinedの場合はそのまま返す
    if (value === null || value === undefined) {
      return value;
    }

    // 既にオブジェクトや配列の場合はそのまま返す
    if (typeof value === 'object') {
      return value;
    }

    // 文字列の場合はJSONオブジェクトに変換を試みる
    if (typeof value === 'string') {
      try {
        // 文字列であればパースを試みる
        return JSON.parse(value);
      } catch (e) {
        // パースに失敗した場合はそのまま文字列として返す
        console.warn('JSON文字列のパースに失敗しました', { value });
        return value;
      }
    }

    // その他の型はそのまま返す
    return value;
  },

  /**
   * デザイン設定のデータ型を一貫して処理する関数
   * @param settings デザイン設定のオブジェクト
   */
  processDesignSettings(settings: any): any {
    // 設定が見つからない場合は空オブジェクトを返す
    if (!settings) {
      return {};
    }

    // コピーを作成して変更を適用する
    const processedSettings = { ...settings };
    
    // 設定オブジェクトが文字列の場合はJSONとしてパースする
    if (typeof processedSettings === 'string') {
      try {
        return JSON.parse(processedSettings);
      } catch (e) {
        console.error('デザイン設定の文字列のJSONパースに失敗しました', e);
        return {};
      }
    }

    // settings直下のJSONフィールドを処理
    if (processedSettings.settings && typeof processedSettings.settings === 'string') {
      try {
        processedSettings.settings = JSON.parse(processedSettings.settings);
      } catch (e) {
        console.error('settings フィールドのJSONパースに失敗しました', e);
        processedSettings.settings = {};
      }
    }

    // sections配列のJSON文字列フィールドを処理
    if (processedSettings.sections) {
      if (typeof processedSettings.sections === 'string') {
        try {
          processedSettings.sections = JSON.parse(processedSettings.sections);
        } catch (e) {
          console.error('sections フィールドのJSONパースに失敗しました', e);
          processedSettings.sections = [];
        }
      }

      // 各セクションの設定フィールドを処理
      if (Array.isArray(processedSettings.sections)) {
        processedSettings.sections = processedSettings.sections.map(section => {
          if (section.settings && typeof section.settings === 'string') {
            try {
              section.settings = JSON.parse(section.settings);
            } catch (e) {
              console.error(`セクション ${section.id} の settings のJSONパースに失敗しました`, e);
              section.settings = {};
            }
          }
          return section;
        });
      }
    } else {
      // sectionsが存在しない場合は空配列を設定
      processedSettings.sections = [];
    }

    // globalSettings フィールドのJSON文字列を処理
    if (processedSettings.globalSettings) {
      if (typeof processedSettings.globalSettings === 'string') {
        try {
          processedSettings.globalSettings = JSON.parse(processedSettings.globalSettings);
        } catch (e) {
          console.error('globalSettings フィールドのJSONパースに失敗しました', e);
          processedSettings.globalSettings = {};
        }
      }
    } else {
      // globalSettingsが存在しない場合は空オブジェクトを設定
      processedSettings.globalSettings = {};
    }

    return processedSettings;
  },

  /**
   * 店舗プロフィールのJSONB型フィールドを処理する関数
   * @param profile 店舗プロフィールのオブジェクト
   */
  processStoreProfile(profile: any): any {
    if (!profile) {
      return null;
    }

    // コピーを作成して変更を適用する
    const processedProfile = { ...profile };

    // JSONB型フィールドのリスト
    const jsonbFields = [
      'special_offers',
      'benefits',
      'requirements',
      'security_measures',
      'privacy_measures',
      'testimonials',
      'gallery_images',
      'sns_links'
    ];

    // 各フィールドを処理
    jsonbFields.forEach(field => {
      if (field in processedProfile) {
        processedProfile[field] = this.convertJsonValue(processedProfile[field]);
      }
    });

    return processedProfile;
  }
};