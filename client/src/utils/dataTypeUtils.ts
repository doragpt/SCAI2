/**
 * データ型変換に関するユーティリティ関数
 * PostgreSQLのJSONB型とJavaScriptオブジェクト間の変換処理を行う
 */

/**
 * JSON/JSONB型のフィールドを適切に処理する関数
 * 様々な形式の入力（文字列、配列、オブジェクト）に対応し、一貫した形式に変換する
 * 
 * @param field 処理するフィールド値
 * @param defaultValue フィールドが空の場合のデフォルト値
 * @param arrayIfEmpty 空の場合に空配列を返すかどうか
 * @returns 処理済みのフィールド値
 */
export function processJsonField<T>(
  field: any, 
  defaultValue: T | null = null, 
  arrayIfEmpty: boolean = false
): T {
  // nullやundefinedの場合
  if (field === null || field === undefined) {
    if (arrayIfEmpty) return ([] as unknown) as T;
    return defaultValue as T;
  }

  // すでに適切な型の場合は変換せずにそのまま返す
  if (typeof field !== 'string') {
    return field as T;
  }

  // 空文字の場合
  if (field === '') {
    if (arrayIfEmpty) return ([] as unknown) as T;
    return defaultValue as T;
  }

  try {
    // JSON文字列からパース
    const parsed = JSON.parse(field);
    return parsed as T;
  } catch (e) {
    // パースに失敗した場合
    console.log(`JSON解析エラー: ${e}. 元の値: ${field}`);
    
    // 区切り文字でスプリットして配列に変換を試みる（カンマまたは区切り文字で区切られたテキスト形式の場合）
    if (typeof field === 'string' && (field.includes(',') || field.includes('、'))) {
      const items = field.split(/[,、]/).map(item => item.trim()).filter(Boolean);
      
      if (arrayIfEmpty || items.length > 0) {
        return (items as unknown) as T;
      }
    }
    
    // 配列じゃないテキストだと判断した場合はそのまま返す
    if (arrayIfEmpty) {
      return ([field] as unknown) as T;
    }
    
    return (field as unknown) as T;
  }
}

/**
 * オブジェクトをJSONB形式に変換する関数
 * データベースに保存する前にオブジェクトを適切な形式に変換する
 * 
 * @param object 変換するオブジェクト
 * @returns JSON文字列またはnull
 */
export function convertToJsonB(object: any): string | null {
  if (object === null || object === undefined) {
    return null;
  }

  // 既に文字列の場合
  if (typeof object === 'string') {
    // 有効なJSONかどうかチェック
    try {
      JSON.parse(object);
      return object; // 既に有効なJSONなのでそのまま返す
    } catch (e) {
      // 有効なJSONでない文字列の場合は引用符付きの文字列としてJSON化
      return JSON.stringify(object);
    }
  }

  // 配列やオブジェクトをJSON文字列に変換
  try {
    return JSON.stringify(object);
  } catch (e) {
    console.error('オブジェクトのJSON変換エラー:', e);
    return null;
  }
}

/**
 * サーバーから返される可能性のある様々な形式の配列を統一形式に変換
 * 
 * @param value 変換する値
 * @returns 配列
 */
export function ensureArray<T>(value: any): T[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as T[];
      }
      return [parsed] as T[];
    } catch (e) {
      // カンマ区切りの文字列を配列に変換
      if (value.includes(',') || value.includes('、')) {
        return value.split(/[,、]/).map(item => item.trim()).filter(Boolean) as T[];
      }
      return [value] as T[];
    }
  }

  // その他の型（オブジェクトなど）は単一要素の配列に変換
  return [value] as T[];
}