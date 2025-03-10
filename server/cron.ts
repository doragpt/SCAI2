import cron from "node-cron";
import { cleanupOldBlogPosts } from "./utils/cleanupBlogPosts";
import { publishScheduledPosts } from "./utils/publishScheduledPosts";

// 毎分実行（予約投稿の公開）
function setupPublishCron() {
  console.log('Setting up scheduled posts publishing cron job');

  cron.schedule('* * * * *', async () => {
    console.log('Running publish scheduled posts cron job:', {
      timestamp: new Date().toISOString()
    });

    try {
      const publishedPosts = await publishScheduledPosts();
      console.log('Publish cron job completed:', {
        publishedCount: publishedPosts?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Publish cron job error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
}

// 毎日午前3時に実行（古い記事の削除）
function setupCleanupCron() {
  console.log('Setting up blog cleanup cron job');

  cron.schedule('0 3 * * *', async () => {
    console.log('Running blog cleanup cron job:', {
      timestamp: new Date().toISOString()
    });

    try {
      const deletedPosts = await cleanupOldBlogPosts();
      console.log('Cleanup cron job completed:', {
        deletedCount: deletedPosts?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cleanup cron job error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
}

export function setupCronJobs() {
  setupPublishCron();
  setupCleanupCron();
}