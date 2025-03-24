import { db } from "../db";
import { blogPosts } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";

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
          sql`${blogPosts.scheduled_at} <= ${now}`
        )
      );

    if (postsToPublish.length === 0) {
      console.log('No scheduled posts to publish');
      return;
    }

    // 該当する記事を公開状態に更新
    // 予約投稿時間をそのまま公開日時に設定
    let publishedPosts = [];
    for (const post of postsToPublish) {
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          status: "published",
          published_at: post.scheduled_at, // 予約時間を公開日時に設定
          updated_at: now
        })
        .where(eq(blogPosts.id, post.id))
        .returning();
      
      publishedPosts.push(updatedPost);
    }

    console.log('Scheduled posts publishing completed:', {
      publishedCount: publishedPosts.length,
      posts: publishedPosts.map(post => ({
        id: post.id,
        title: post.title,
        scheduled_at: post.scheduled_at,
        published_at: post.published_at
      })),
      timestamp: now.toISOString()
    });

    return publishedPosts;
  } catch (error) {
    console.error('Scheduled posts publishing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}