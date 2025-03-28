/**
 * データベースとの間のデータ型変換を処理するユーティリティ
 * 
 * このモジュールでは、アプリケーションとデータベース間でのデータ型の一貫性を
 * 保つための変換関数を提供します。
 */

/**
 * フィールド名に基づいて、データベースに送信する前に適切なデータ型に変換する
 * 
 * @param fieldName フィールド名
 * @param value 変換する値
 * @returns データベースに送信するための適切な形式に変換された値
 */
export function prepareFieldForDatabase(fieldName: string, value: any): any {
  // TEXT型としてデータベースに保存するフィールド
  const textFields = [
    'privacy_measures', 
    'commitment', 
    'security_measures',
    'application_notes'
  ];
  
  // JSONB型としてデータベースに保存するフィールド
  const jsonbFields = [
    'requirements', 
    'special_offers', 
    'gallery_photos', 
    'design_settings',
    'job_videos',
    'salary_examples',
    'facility_features',
    'testimonials'
  ];
  
  // フィールドの種類に応じた変換処理
  if (textFields.includes(fieldName)) {
    // TEXTフィールドは常に文字列として扱う
    return typeof value === 'string' ? value : String(value || '');
  } 
  else if (jsonbFields.includes(fieldName)) {
    // JSONBフィールドの場合
    if (value === null || value === undefined) {
      return null; // NULLはそのまま
    }
    
    if (typeof value === 'string') {
      try {
        // すでにJSON文字列の場合はオブジェクトに変換
        return JSON.parse(value);
      } catch {
        // JSON解析できない文字列の場合は引用符で囲んでJSON化
        return JSON.stringify(value);
      }
    }
    
    // オブジェクトや配列は既にJSON互換なのでそのまま返す
    return value;
  }
  
  // デフォルトはそのまま返す
  return value;
}

/**
 * データベースから取得したデータを適切な型に変換する
 * 
 * @param fieldName フィールド名
 * @param value データベースから取得した値
 * @returns アプリケーションで使用するための適切な型に変換された値
 */
export function processFieldFromDatabase(fieldName: string, value: any): any {
  // TEXT型としてデータベースに保存されているフィールド
  const textFields = [
    'privacy_measures', 
    'commitment', 
    'security_measures',
    'application_notes'
  ];
  
  // JSONB型としてデータベースに保存されているフィールド
  const jsonbFields = [
    'requirements', 
    'special_offers', 
    'gallery_photos', 
    'design_settings',
    'job_videos',
    'salary_examples',
    'facility_features',
    'testimonials'
  ];
  
  if (value === null || value === undefined) {
    return value;
  }
  
  // フィールドの種類に応じた変換処理
  if (textFields.includes(fieldName)) {
    // TEXTフィールドは常に文字列として取得
    return typeof value === 'string' ? value : String(value);
  } 
  else if (jsonbFields.includes(fieldName)) {
    // JSONBフィールドの場合
    if (typeof value === 'string') {
      try {
        // JSON文字列の場合はオブジェクトに変換
        return JSON.parse(value);
      } catch {
        // 解析できない場合は文字列のまま
        return value;
      }
    }
    
    // すでにオブジェクトの場合はそのまま
    return value;
  }
  
  // デフォルトはそのまま返す
  return value;
}

/**
 * オブジェクト内の全フィールドを適切な型に変換する
 * 
 * @param data 変換するオブジェクト
 * @param isForDatabase trueの場合、データベースへの保存用に変換
 * @returns 変換されたオブジェクト
 */
export function processAllFields(data: Record<string, any>, isForDatabase: boolean = true): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(data).forEach(key => {
    if (isForDatabase) {
      result[key] = prepareFieldForDatabase(key, data[key]);
    } else {
      result[key] = processFieldFromDatabase(key, data[key]);
    }
  });
  
  return result;
}

/**
 * エラーメッセージからJSONB関連のエラー情報を抽出する
 * 
 * @param error エラーオブジェクト
 * @param requestData 元のリクエストデータ
 * @returns 詳細なエラー情報
 */
export function extractJsonErrorDetails(error: any, requestData?: Record<string, any>) {
  const errorInfo: Record<string, any> = {
    message: 'データベースエラーが発生しました',
    sqlError: error.message || 'Unknown error'
  };
  
  // JSONエラーの解析
  let invalidToken = null;
  let errorField = null;
  
  if (error.message && error.message.includes('invalid input syntax for type json')) {
    const tokenMatch = error.message.match(/token "([^"]+)"/);
    if (tokenMatch) {
      invalidToken = tokenMatch[1];
      errorInfo.invalidToken = invalidToken;
    }
    
    const columnMatch = error.message.match(/column "([^"]+)"/);
    if (columnMatch) {
      errorField = columnMatch[1];
      errorInfo.errorField = errorField;
      
      // TEXT型とJSONB型のフィールドリスト
      const textFields = [
        'privacy_measures', 
        'commitment', 
        'security_measures',
        'application_notes'
      ];
      
      const jsonbFields = [
        'requirements', 
        'special_offers', 
        'gallery_photos', 
        'design_settings',
        'job_videos',
        'salary_examples',
        'facility_features',
        'testimonials'
      ];
      
      // フィールドの期待される型の追加情報
      if (textFields.includes(errorField)) {
        errorInfo.expectedType = 'TEXT';
        errorInfo.resolution = '文字列型として処理する必要があります。オブジェクトや配列はJSON.stringify()で文字列化してから保存してください。';
      } else if (jsonbFields.includes(errorField)) {
        errorInfo.expectedType = 'JSONB';
        errorInfo.resolution = '有効なJSONデータとして処理する必要があります。文字列の場合はJSON.parse()でオブジェクトに変換してから処理してください。';
      }
    }
  }
  
  // リクエストデータが提供されている場合、追加の診断情報を追加
  if (requestData) {
    // データ型情報を収集
    const fieldTypes: Record<string, string> = {};
    Object.keys(requestData).forEach(key => {
      fieldTypes[key] = typeof requestData[key];
      
      // 配列かどうかもチェック
      if (Array.isArray(requestData[key])) {
        fieldTypes[key] += ' (array)';
      }
      
      // オブジェクトの場合は内部構造についての追加情報
      if (typeof requestData[key] === 'object' && requestData[key] !== null && !Array.isArray(requestData[key])) {
        fieldTypes[key] += ` (keys: ${Object.keys(requestData[key]).join(', ')})`;
      }
    });
    errorInfo.requestDataTypes = fieldTypes;
    
    // エラーフィールドに関する詳細情報
    if (errorField && requestData[errorField] !== undefined) {
      errorInfo.problematicField = {
        name: errorField,
        type: typeof requestData[errorField],
        isArray: Array.isArray(requestData[errorField]),
        sample: typeof requestData[errorField] === 'string' 
          ? requestData[errorField].substring(0, 50) 
          : JSON.stringify(requestData[errorField]).substring(0, 50),
        length: typeof requestData[errorField] === 'string' 
          ? requestData[errorField].length 
          : (Array.isArray(requestData[errorField]) ? requestData[errorField].length : 'N/A')
      };
    }
    
    // サンプル値を収集
    const fieldSamples: Record<string, string> = {};
    Object.keys(requestData)
      .filter(k => typeof requestData[k] === 'string')
      .forEach(key => {
        fieldSamples[key] = String(requestData[key]).substring(0, 20); // サンプル値を取得
      });
    errorInfo.fieldSamples = fieldSamples;
  }
  
  return errorInfo;
}