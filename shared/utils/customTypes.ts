import { customType } from 'drizzle-orm/pg-core';

/**
 * DrizzleのJSONB型二重エンコード問題を回避するカスタム型
 * PostgreSQL JSONBカラム用の型で、既にオブジェクト/配列の値を
 * 追加でstringifyせずにそのままドライバに渡す
 */
export const customJsonb = () => customType<any>({
  dataType() {
    return 'jsonb';
  },
  toDriver(value: any) {
    // データ型に応じた処理
    if (value === null || value === undefined) {
      return null;
    }
    
    // 既に文字列化されている場合はパースを試みる
    if (typeof value === 'string') {
      try {
        // 特殊ケース: 単純な文字列が誤ってJSON型フィールドに渡された場合、
        // JSON形式の文字列に変換する（例："text" → "\"text\""）
        if (value.trim().charAt(0) !== '{' && value.trim().charAt(0) !== '[') {
          console.warn('カスタムJSONB: 単純なテキストがJSONB型に渡されました。正しいJSON文字列に変換します。', value);
          return JSON.stringify(value);
        }
        
        // 既にJSON文字列ならパースしてオブジェクトに戻す
        console.log('カスタムJSONB: 文字列をパースします', value.substring(0, 30) + '...');
        return JSON.parse(value);
      } catch (e) {
        // パースに失敗した場合は、有効なJSONとして扱えるように修正
        console.warn('カスタムJSONB: 文字列のパースに失敗しました。正しいJSON文字列として処理します。', e);
        return JSON.stringify(value); // 文字列自体をJSON文字列としてエンコード
      }
    }
    
    // オブジェクトや配列はそのまま渡す
    if (typeof value === 'object') {
      return value;
    }
    
    // その他の型（数値、真偽値など）はJSON文字列に変換
    console.warn('カスタムJSONB: プリミティブ型がJSONB型に渡されました。JSON文字列に変換します。', value);
    return JSON.stringify(value);
  },
  fromDriver(value: unknown): any {
    return value as any;
  },
});