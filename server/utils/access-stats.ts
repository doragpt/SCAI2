import { db } from "../db";
import { accessLogs, accessStats, type InsertAccessStat } from "@shared/schema";
import { sql } from "drizzle-orm";
import { startOfDay, endOfDay, format } from "date-fns";

// 指定された日付のアクセス統計を生成
export async function generateDailyStats(date: Date, storeId: number): Promise<InsertAccessStat> {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  // 総訪問数を取得
  const [totalVisits] = await db
    .select({ count: sql<number>`count(*)` })
    .from(accessLogs)
    .where(sql`store_id = ${storeId} AND created_at BETWEEN ${startDate} AND ${endDate}`);

  // ユニークビジター数を取得（IPハッシュベース）
  const [uniqueVisitors] = await db
    .select({ count: sql<number>`count(DISTINCT ip_hash)` })
    .from(accessLogs)
    .where(sql`store_id = ${storeId} AND created_at BETWEEN ${startDate} AND ${endDate}`);

  // 時間帯別の訪問数を集計
  const hourlyStats: Record<string, number> = {};
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    const [hourCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(accessLogs)
      .where(sql`
        store_id = ${storeId} AND 
        created_at BETWEEN ${startDate} AND ${endDate} AND
        EXTRACT(HOUR FROM created_at) = ${i}
      `);
    hourlyStats[hour] = hourCount.count;
  }

  return {
    storeId,
    date: format(date, 'yyyy-MM-dd'),
    totalVisits: totalVisits.count,
    uniqueVisitors: uniqueVisitors.count,
    hourlyStats,
    createdAt: new Date()
  };
}

// 日次統計データを保存
export async function saveDailyStats(stats: InsertAccessStat) {
  try {
    await db.insert(accessStats).values(stats);
    console.log(`Daily stats saved for store ${stats.storeId} on ${stats.date}`);
  } catch (error) {
    console.error('Error saving daily stats:', error);
    throw error;
  }
}

// 指定された期間の統計データを取得
export async function getStoreStats(storeId: number, startDate: Date, endDate: Date) {
  return db
    .select()
    .from(accessStats)
    .where(sql`
      store_id = ${storeId} AND 
      date BETWEEN ${format(startDate, 'yyyy-MM-dd')} AND ${format(endDate, 'yyyy-MM-dd')}
    `)
    .orderBy(sql`date DESC`);
}
