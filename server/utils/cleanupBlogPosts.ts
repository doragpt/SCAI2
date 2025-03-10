import { db } from "../db";
import { blogPosts } from "@shared/schema";
import { and, lt, sql } from "drizzle-orm";

export async function cleanupOldBlogPosts() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180); // 180日前

    console.log('Starting blog posts cleanup:', {
      cutoffDate,
      timestamp: new Date().toISOString()
    });

    // 削除対象の記事を取得
    const postsToDelete = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          sql`${blogPosts.createdAt} < ${cutoffDate}`,
          sql`${blogPosts.status} = 'published'`
        )
      );

    if (postsToDelete.length === 0) {
      console.log('No old blog posts to delete');
      return;
    }

    // 記事の削除
    const result = await db
      .delete(blogPosts)
      .where(
        and(
          sql`${blogPosts.createdAt} < ${cutoffDate}`,
          sql`${blogPosts.status} = 'published'`
        )
      )
      .returning();

    console.log('Blog posts cleanup completed:', {
      deletedCount: result.length,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('Blog posts cleanup error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
