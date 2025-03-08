import { AccessStatsResponse } from "@shared/schema";

/**
 * クエリにタイムアウトを設定するためのラッパー関数
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  try {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );

    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    console.warn('Query timeout occurred:', {
      timeoutMs,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return fallback;
  }
}

/**
 * アクセス統計クエリのデフォルト値
 */
export const DEFAULT_STATS: AccessStatsResponse = {
  today: { total: 0, unique: 0 },
  monthly: { total: 0, unique: 0 },
  hourly: []
};

/**
 * 環境変数によるアクセス統計の制御
 */
export function isAccessStatsEnabled(): boolean {
  return process.env.DISABLE_ACCESS_STATS !== 'true';
}
