import cron from "node-cron";
import { cleanupOldBlogPosts } from "./utils/cleanupBlogPosts";
import { publishScheduledPosts } from "./utils/publishScheduledPosts";

// 毎分実行（予約投稿の公開）
function setupPublishCron() {
  console.log('Setting up scheduled posts publishing cron job');

  // 毎分実行されるジョブ
  const publishJob = cron.schedule('*/1 * * * *', async () => {
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

  // ジョブの開始
  publishJob.start();
}

// 毎日午前3時に実行（古い記事の削除）
function setupCleanupCron() {
  console.log('Setting up blog cleanup cron job');

  // 毎日午前3時に実行されるジョブ
  const cleanupJob = cron.schedule('0 3 * * *', async () => {
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

  // ジョブの開始
  cleanupJob.start();
}

// すべてのcronジョブをセットアップ
export function setupCronJobs() {
  try {
    console.log('Starting cron jobs setup...');
    setupPublishCron();
    setupCleanupCron();
    console.log('All cron jobs setup completed');
  } catch (error) {
    console.error('Cron jobs setup error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}