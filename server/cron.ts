import cron from "node-cron";
import { cleanupOldBlogPosts } from "./utils/cleanupBlogPosts";
import { publishScheduledPosts } from "./utils/publishScheduledPosts";

// 毎分実行（予約投稿の公開）
function setupPublishCron() {
  console.log('Setting up scheduled posts publishing cron job');

  return new Promise<void>((resolve) => {
    cron.schedule('* * * * *', async () => {
      try {
        const publishedPosts = await publishScheduledPosts();
        if (publishedPosts?.length) {
          console.log('Published scheduled posts:', {
            count: publishedPosts.length,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Publish cron job error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
    resolve();
  });
}

// 毎日午前3時に実行（古い記事の削除）
function setupCleanupCron() {
  console.log('Setting up blog cleanup cron job');

  return new Promise<void>((resolve) => {
    cron.schedule('0 3 * * *', async () => {
      try {
        const deletedPosts = await cleanupOldBlogPosts();
        if (deletedPosts?.length) {
          console.log('Cleaned up old blog posts:', {
            count: deletedPosts.length,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Cleanup cron job error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
    resolve();
  });
}

// cronジョブのセットアップを非同期化
export async function setupCronJobs() {
  await Promise.all([
    setupPublishCron(),
    setupCleanupCron()
  ]);
  console.log('All cron jobs setup completed');
}