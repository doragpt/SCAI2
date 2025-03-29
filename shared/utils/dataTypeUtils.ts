/**
 * データ型変換ユーティリティ
 * 
 * PostgreSQLのカラム型（JSONB/TEXT）とJavaScriptのデータ型（オブジェクト/配列/文字列）間の
 * 変換を一貫して行うためのユーティリティ関数群
 */

export const dataUtils = {
  /**
   * 店舗プロフィールデータを処理
   * 各フィールドのデータ型を正規化し、適切な形式に変換
   */
  processStoreProfile: (data: any): any => {
    if (!data) return {};
    
    // 各特殊フィールドの処理を行う
    const processedData = { ...data };
    
    // フィールド毎の処理ロジックを適用
    const processingFields = [
      { field: 'requirements', processor: 'processRequirements' },
      { field: 'security_measures', processor: 'processSecurityMeasures' },
      { field: 'privacy_measures', processor: 'processPrivacyMeasures' },
      { field: 'gallery_photos', processor: 'processGalleryPhotos' },
      { field: 'special_offers', processor: 'processSpecialOffers' },
      { field: 'design_settings', processor: 'processDesignSettings' },
      { field: 'commitment', processor: 'processTextFields' }
    ];

    // 各フィールドに対して対応する処理を適用
    processingFields.forEach(({ field, processor }) => {
      if (field in data) {
        console.log(`プロフィールフィールド処理: ${field}`, {
          type: typeof data[field],
          value: data[field]
        });
        
        try {
          // @ts-ignore - 動的メソッド呼び出し
          processedData[field] = dataUtils[processor](data[field]);
        } catch (error) {
          console.error(`フィールド処理エラー: ${field}`, error);
        }
      }
    });
    
    return processedData;
  },
  /**
   * プライバシー対策データ処理特化関数
   * privacy_measuresフィールド専用の処理ロジック
   * 常に文字列配列として正規化
   */
  processPrivacyMeasures: (value: any): string[] => {
    if (!value) return [];
    
    // 既に配列の場合
    if (Array.isArray(value)) {
      return value
        .filter(item => item !== null && item !== undefined)
        .map(item => typeof item === 'string' ? item : String(item));
    }
    
    // 文字列の場合
    if (typeof value === 'string') {
      try {
        // JSON文字列として解析を試みる
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // 配列として解析できた場合は各要素を確認
          return parsed
            .filter(item => item !== null && item !== undefined)
            .map(item => typeof item === 'string' ? item : String(item));
        }
        // JSON文字列だが配列ではない場合は単一要素の配列として扱う
        return [value];
      } catch (e) {
        // JSON解析に失敗した場合（通常のテキスト）は単一要素の配列として扱う
        return [value];
      }
    }
    
    // オブジェクトまたはその他の型の場合
    return [String(value)];
  },

  /**
   * セキュリティ対策データ処理特化関数
   * security_measuresフィールド専用の処理ロジック
   * JSONB型の場合と文字列（TEXT型）の場合の両方に対応
   */
  processSecurityMeasures: (value: any): any => {
    if (!value) return [];
    
    // 既に配列の場合
    if (Array.isArray(value)) {
      return value
        .filter(item => item !== null && item !== undefined)
        .map(item => {
          // オブジェクトの場合はそのまま
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            return {
              id: item.id || `security-${Math.random().toString(36).substring(2, 9)}`,
              title: item.title || String(item.name || ''),
              description: item.description || '',
              category: item.category || 'other',
              level: item.level || 'medium',
              order: item.order || 0
            };
          }
          // 文字列の場合は最小限の構造を持つオブジェクトに変換
          return {
            id: `security-${Math.random().toString(36).substring(2, 9)}`,
            title: typeof item === 'string' ? item : String(item),
            description: '',
            category: 'other',
            level: 'medium',
            order: 0
          };
        });
    }
    
    // 文字列の場合
    if (typeof value === 'string') {
      try {
        // JSON文字列として解析を試みる
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // 配列として解析できた場合は各要素を処理
          return parsed
            .filter(item => item !== null && item !== undefined)
            .map((item, index) => {
              if (item && typeof item === 'object' && !Array.isArray(item)) {
                return {
                  id: item.id || `security-${Math.random().toString(36).substring(2, 9)}`,
                  title: item.title || String(item.name || ''),
                  description: item.description || '',
                  category: item.category || 'other',
                  level: item.level || 'medium',
                  order: item.order || index
                };
              }
              return {
                id: `security-${Math.random().toString(36).substring(2, 9)}`,
                title: typeof item === 'string' ? item : String(item),
                description: '',
                category: 'other',
                level: 'medium',
                order: index
              };
            });
        }
        // 単一要素の配列として扱う
        return [{ 
          id: `security-${Math.random().toString(36).substring(2, 9)}`,
          title: value,
          description: '',
          category: 'other',
          level: 'medium',
          order: 0
        }];
      } catch (e) {
        // JSON解析に失敗した場合（通常のテキスト）
        return [{ 
          id: `security-${Math.random().toString(36).substring(2, 9)}`,
          title: value,
          description: '',
          category: 'other',
          level: 'medium',
          order: 0
        }];
      }
    }
    
    // オブジェクトの場合
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [{
        id: value.id || `security-${Math.random().toString(36).substring(2, 9)}`,
        title: value.title || String(value.name || ''),
        description: value.description || '',
        category: value.category || 'other',
        level: value.level || 'medium',
        order: value.order || 0
      }];
    }
    
    // その他の型
    return [];
  },

  /**
   * 値を配列として確保する
   * @param value 変換する値
   * @param defaultValue デフォルト値（解析失敗時）
   * @returns 配列
   */
  ensureArray: (value: any, defaultValue: any[] = []): any[] => {
    if (Array.isArray(value)) {
      // 配列の場合は各要素を検証（nullやundefinedを除去）
      return value.filter(item => item !== null && item !== undefined);
    }
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // パースされた配列の要素を検証（nullやundefinedを除去）
          return parsed.filter(item => item !== null && item !== undefined);
        }
        return defaultValue;
      } catch (error) {
        console.error("JSON解析エラー:", error);
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
   * JSONB型用の一般オブジェクト処理
   * PostgreSQLでJSONB型カラムに保存する任意のオブジェクトデータを準備
   */
  prepareObjectForJsonb: (value: any): any => {
    if (!value) return null;
    
    // 文字列の場合は既にJSON化されていると仮定
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // パースに失敗した場合は元の値を返す
      }
    }
    
    // オブジェクトや配列はそのまま返す（SQLリクエスト時に適切に処理される）
    return value;
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
   * プライバシー対策などの文字列フィールドを適切に処理する
   * privacy_measuresなどのTEXT型カラムに保存するプレーンなテキストデータを準備
   * 誤ってJSONBとして扱われないようにする
   */
  processTextFields: (value: any, defaultValue: string = ""): string => {
    if (value === null || value === undefined) return defaultValue;
    
    // オブジェクトや配列が誤って渡された場合に文字列化
    if (typeof value === 'object') {
      try {
        console.warn('テキストフィールドにオブジェクトが渡されました。文字列化します。', { type: typeof value });
        return JSON.stringify(value);
      } catch (e) {
        console.error('テキストフィールドの変換エラー:', e);
        return defaultValue;
      }
    }
    
    // 文字列の場合はそのまま返す
    if (typeof value === 'string') return value;
    
    // その他の型は文字列化
    return String(value || defaultValue);
  },


  
  /**
   * ギャラリー写真の処理
   * gallery_photosフィールドを処理し、配列として正規化
   */
  processGalleryPhotos: (value: any): any[] => {
    // 配列が期待される
    try {
      if (Array.isArray(value)) {
        // 各写真のIDとURLを確認
        return value.filter(photo => {
          const isValid = photo && typeof photo === 'object' && photo.id && photo.url;
          if (!isValid) {
            console.warn('無効なギャラリー写真データを除外:', photo);
          }
          return isValid;
        }).map((photo, index) => ({
          ...photo,
          order: photo.order ?? index // orderがなければインデックスを使用
        }));
      }
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return dataUtils.processGalleryPhotos(parsed); // 再帰的に処理
          }
          console.warn('ギャラリー写真が文字列から解析されましたが、配列ではありません:', typeof parsed);
          return [];
        } catch (e) {
          console.error('ギャラリー写真の解析エラー:', e);
          return [];
        }
      }
      
      console.warn('ギャラリー写真の形式が無効です。空配列を使用します。', { type: typeof value });
      return [];
    } catch (error) {
      console.error('ギャラリー写真処理中の予期せぬエラー:', error);
      return [];
    }
  },

  /**
   * 要件データの処理
   * requirementsフィールドをオブジェクトとして正規化
   */
  processRequirements: (value: any): any => {
    const defaultRequirements = {
      cup_size_conditions: [],
      accepts_temporary_workers: true,
      requires_arrival_day_before: false,
      prioritize_titles: false,
      other_conditions: []
    };
    
    try {
      // 文字列の場合はパース
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // オブジェクトとして正常にパースできた場合
            return {
              ...defaultRequirements,
              ...parsed,
              // cup_size_conditionsが配列であることを確保
              cup_size_conditions: Array.isArray(parsed.cup_size_conditions) 
                ? parsed.cup_size_conditions 
                : defaultRequirements.cup_size_conditions,
              // other_conditionsが配列であることを確保
              other_conditions: Array.isArray(parsed.other_conditions)
                ? parsed.other_conditions
                : defaultRequirements.other_conditions
            };
          }
          
          console.warn('要件データが文字列からパースされましたが、有効なオブジェクトではありません。', typeof parsed);
          return defaultRequirements;
        } catch (e) {
          console.error('要件データの解析エラー:', e);
          return defaultRequirements;
        }
      }
      
      // オブジェクトの場合
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
          ...defaultRequirements,
          ...value,
          // cup_size_conditionsが配列であることを確保
          cup_size_conditions: Array.isArray(value.cup_size_conditions) 
            ? value.cup_size_conditions 
            : defaultRequirements.cup_size_conditions,
          // other_conditionsが配列であることを確保
          other_conditions: Array.isArray(value.other_conditions)
            ? value.other_conditions
            : defaultRequirements.other_conditions
        };
      }
      
      console.warn('要件データの形式が無効です。デフォルト値を使用します。', { type: typeof value });
      return defaultRequirements;
    } catch (error) {
      console.error('要件データ処理中の予期せぬエラー:', error);
      return defaultRequirements;
    }
  },

  /**
   * 特別オファーの処理
   * special_offersフィールドを配列として正規化
   */
  processSpecialOffers: (value: any): any[] => {
    try {
      // 配列の場合
      if (Array.isArray(value)) {
        // 各オファーをバリデーション
        return value.filter(offer => {
          const isValid = offer && typeof offer === 'object' && offer.id && offer.title;
          if (!isValid) {
            console.warn('無効な特別オファーデータを除外:', offer);
          }
          return isValid;
        }).map((offer, index) => ({
          ...offer,
          type: offer.type || "bonus", // typeが未設定の場合は"bonus"をデフォルト値として使用
          order: offer.order ?? index, // orderがなければインデックスを使用
          isActive: offer.isActive ?? true,
          isLimited: offer.isLimited ?? false,
          targetAudience: Array.isArray(offer.targetAudience) ? offer.targetAudience : []
        }));
      }
      
      // 文字列の場合はJSONパースを試みる
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return dataUtils.processSpecialOffers(parsed); // 再帰的に処理
          }
          console.warn('特別オファーが文字列から解析されましたが、配列ではありません:', typeof parsed);
          return [];
        } catch (e) {
          console.error('特別オファーの解析エラー:', e);
          return [];
        }
      }
      
      console.warn('特別オファーの形式が無効です。空配列を使用します。', { type: typeof value });
      return [];
    } catch (error) {
      console.error('特別オファー処理中の予期せぬエラー:', error);
      return [];
    }
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
      } : 'undefined',
      // TEXT型フィールドの情報も追加
      privacy_measures: data.privacy_measures ? {
        type: typeof data.privacy_measures,
        sample: typeof data.privacy_measures === 'string' 
          ? data.privacy_measures.substring(0, 50) + (data.privacy_measures.length > 50 ? '...' : '')
          : (data.privacy_measures ? String(data.privacy_measures).substring(0, 50) : 'null or undefined')
      } : 'undefined',
      security_measures: data.security_measures ? {
        type: typeof data.security_measures,
        sample: typeof data.security_measures === 'string' 
          ? data.security_measures.substring(0, 50) + (data.security_measures.length > 50 ? '...' : '')
          : (data.security_measures ? String(data.security_measures).substring(0, 50) : 'null or undefined')
      } : 'undefined',
      commitment: data.commitment ? {
        type: typeof data.commitment,
        sample: typeof data.commitment === 'string' 
          ? data.commitment.substring(0, 50) + (data.commitment.length > 50 ? '...' : '')
          : (data.commitment ? String(data.commitment).substring(0, 50) : 'null or undefined')
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