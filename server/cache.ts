import { AccessStatsResponse } from "@shared/schema";

// キャッシュのインターフェース
interface StatsCache {
  data: AccessStatsResponse;
  timestamp: number;
}

// キャッシュの有効期間（5分）
const CACHE_TTL = 5 * 60 * 1000;

// メモリ内キャッシュ
const statsCache = new Map<number, StatsCache>();

// キャッシュの取得関数
export function getCachedStats(storeId: number): AccessStatsResponse | null {
  const cached = statsCache.get(storeId);
  if (!cached) return null;

  // キャッシュの有効期限をチェック
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    statsCache.delete(storeId);
    console.log('Cache expired for store:', {
      storeId,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  console.log('Cache hit for store:', {
    storeId,
    age: `${Math.round((Date.now() - cached.timestamp) / 1000)}s`,
    timestamp: new Date().toISOString()
  });

  return cached.data;
}

// キャッシュの保存関数
export function setCachedStats(storeId: number, data: AccessStatsResponse): void {
  statsCache.set(storeId, {
    data,
    timestamp: Date.now()
  });

  console.log('Cache updated for store:', {
    storeId,
    timestamp: new Date().toISOString()
  });
}

// キャッシュのクリア関数
export function clearStatsCache(storeId: number): void {
  statsCache.delete(storeId);
  console.log('Cache cleared for store:', {
    storeId,
    timestamp: new Date().toISOString()
  });
}