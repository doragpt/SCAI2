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
    // 既にオブジェクトの場合はそのまま渡す（二重エンコードを防止）
    return value;
  },
  fromDriver(value: unknown): any {
    return value as any;
  },
});