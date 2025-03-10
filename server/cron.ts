import cron from "node-cron";
import { cleanupOldBlogPosts } from "./utils/cleanupBlogPosts";

// 毎日午前3時に実行
export function setupCleanupCron() {
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
