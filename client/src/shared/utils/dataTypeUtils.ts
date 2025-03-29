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
        // 空文字列の特別処理
        if (value.trim() === '') {
          return [];
        }
        
        // 文字列であればパースを試みる
        const parsedValue = JSON.parse(value);
        
        // パース結果が有効かどうか確認
        return parsedValue;
      } catch (e) {
        // パースに失敗した場合はそのまま文字列として返す
        console.warn('JSON文字列のパースに失敗しました', { 
          value: value.length > 50 ? `${value.substring(0, 50)}...` : value,
          error: e instanceof Error ? e.message : String(e)
        });
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
        processedSettings.sections = processedSettings.sections.map((section: any) => {
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
      'sns_links',
      'sns_urls',
      'gallery_photos',
      'job_videos',
      'salary_examples',
      'facility_features'
    ];

    // 各フィールドを処理
    for (const field of jsonbFields) {
      if (field in processedProfile) {
        console.log(`プロフィールフィールド処理: ${field}`, { 
          type: typeof processedProfile[field],
          value: processedProfile[field] 
        });

        try {
          // 配列が期待されるフィールドで空の文字列や無効な値の場合、空配列にする
          if (processedProfile[field] === null || 
              processedProfile[field] === undefined ||
              processedProfile[field] === '' ||
              processedProfile[field] === 'null' ||
              processedProfile[field] === '[]') {
            
            processedProfile[field] = [];
            console.log(`フィールド ${field} を空配列に設定しました`);
            continue;
          }
          
          // JSONとして処理
          processedProfile[field] = this.convertJsonValue(processedProfile[field]);
          
          // 配列型の場合、値が配列になっていることを確認
          // requirements は特殊処理 - オブジェクト型を許可
          if (field === 'requirements') {
            // requirementsはオブジェクト型（複雑な構造）の場合そのまま
            if (typeof processedProfile[field] === 'object' && !Array.isArray(processedProfile[field])) {
              // オブジェクト形式でOK
              console.log(`requirements オブジェクト形式: `, processedProfile[field]);
            } else if (Array.isArray(processedProfile[field])) {
              // 配列形式の場合も許可
              console.log(`requirements 配列形式: 長さ=${processedProfile[field].length}`);
            } else {
              // どちらでもない場合は空のオブジェクトに設定
              console.warn(`requirements はオブジェクトまたは配列であるべきですが、別の型です。空オブジェクトを使用します。`);
              processedProfile[field] = { accepts_temporary_workers: false };
            }
          }
          // その他の配列型フィールド
          else if (
            ['special_offers', 'benefits', 'gallery_images', 
             'sns_links', 'sns_urls', 'gallery_photos', 'security_measures', 
             'privacy_measures', 'testimonials'].includes(field)
          ) {
            if (!Array.isArray(processedProfile[field])) {
              console.warn(`フィールド ${field} は配列であるべきですが、配列ではありません。空配列を使用します。`);
              processedProfile[field] = [];
            }
          }
        } catch (e) {
          console.error(`フィールド ${field} の処理中にエラーが発生しました`, e);
          // エラーが発生した場合、適切なデフォルト値を設定
          if (field === 'requirements') {
            // requirements はオブジェクト形式でデフォルト値を設定
            processedProfile[field] = { accepts_temporary_workers: false };
          } else if (['special_offers', 'benefits', 'sns_links', 'gallery_images', 
                       'gallery_photos', 'security_measures', 'privacy_measures', 
                       'testimonials'].includes(field)) {
            // 他の配列型フィールドは空配列を設定
            processedProfile[field] = [];
          } else {
            // その他は空オブジェクト
            processedProfile[field] = {};
          }
        }
      }
    }

    return processedProfile;
  }
};