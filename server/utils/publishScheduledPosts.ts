import { db } from "../db";
import { blogPosts } from "@shared/schema";
import { and, lte, eq } from "drizzle-orm";

export async function publishScheduledPosts() {
  try {
    const now = new Date();
    console.log('Starting scheduled posts publishing:', {
      currentTime: now.toISOString()
    });

    // 公開予定時刻を過ぎた予約投稿を取得
    const postsToPublish = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "scheduled"),
          lte(blogPosts.scheduledAt, now)
        )
      );

    if (postsToPublish.length === 0) {
      console.log('No scheduled posts to publish');
      return;
    }

    // 該当する記事を公開状態に更新
    const result = await db
      .update(blogPosts)
      .set({
        status: "published",
        publishedAt: now,
        updatedAt: now
      })
      .where(
        and(
          eq(blogPosts.status, "scheduled"),
          lte(blogPosts.scheduledAt, now)
        )
      )
      .returning();

    console.log('Scheduled posts publishing completed:', {
      publishedCount: result.length,
      posts: result.map(post => ({
        id: post.id,
        title: post.title,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt
      })),
      timestamp: now.toISOString()
    });

    return result;
  } catch (error) {
    console.error('Scheduled posts publishing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}