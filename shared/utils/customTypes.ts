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
        // 既にJSON文字列ならパースしてオブジェクトに戻す
        console.log('カスタムJSONB: 文字列をパースします', value.substring(0, 30) + '...');
        return JSON.parse(value);
      } catch (e) {
        // パースに失敗した場合は文字列のままJSONオブジェクトとして渡す
        console.warn('カスタムJSONB: 文字列のパースに失敗しました。単一の文字列として扱います。', e);
        return value;
      }
    }
    
    // オブジェクトや配列はそのまま渡す
    if (typeof value === 'object') {
      return value;
    }
    
    // その他の型（数値、真偽値など）はそのまま
    return value;
  },
  fromDriver(value: unknown): any {
    return value as any;
  },
});