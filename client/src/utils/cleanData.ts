/**
 * オブジェクト内の空の配列（[]）を再帰的に削除する関数
 */
export function cleanEmptyArrays(obj: any): any {
  if (Array.isArray(obj)) {
    // 配列が空の場合は undefined を返す（キー削除の対象）
    if (obj.length === 0) {
      return undefined;
    }
    // 配列が空でなければ、各要素に対して再帰的に処理
    return obj
      .map(cleanEmptyArrays)
      .filter((item) => item !== undefined);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const cleanedValue = cleanEmptyArrays(value);
      // undefined でなければ設定（つまり、空配列の場合はキー自体を削除）
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    });
    return cleaned;
  }
  return obj;
}
