import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { db } from '../db';
import { blogPosts } from '@shared/schema';
import { eq, desc, and, gte, lte, lt, asc } from 'drizzle-orm';
import multer from 'multer';
import { uploadToS3, getSignedS3Url } from '../utils/s3';
import { log } from '../vite';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 店舗ブログ記事取得の共通関数
const getBlogPostsByStore = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    // ブログ投稿数のカウント（特定の店舗の投稿のみ）
    const totalCountResult = await db.select({
      count: db.$custom<number>`count(*)`
    })
    .from(blogPosts)
    .where(eq(blogPosts.store_id, userId));

    const totalItems = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalItems / pageSize);

    // ブログ投稿の取得（特定の店舗の投稿のみ）
    const posts = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.store_id, userId))
      .orderBy(desc(blogPosts.created_at))
      .limit(pageSize)
      .offset(offset);

    return res.status(200).json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ error: 'ブログ記事の取得中にエラーが発生しました' });
  }
};

// ブログ記事の取得（店舗管理画面用）
router.get('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  return getBlogPostsByStore(req, res);
});

// 店舗の投稿用エンドポイント（追加の統一性のため）
router.get('/store-posts', authenticate, authorize('store'), async (req: Request, res: Response) => {
  return getBlogPostsByStore(req, res);
});

// ブログ記事の取得（一般公開用）
router.get('/public', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const offset = (page - 1) * pageSize;

    // クエリビルダー（共通部分）
    let query = db.select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'));

    // 特定の店舗のブログ記事のみを取得
    if (storeId) {
      query = query.where(eq(blogPosts.store_id, storeId));
    }

    // ブログ投稿数のカウント
    const totalCountResult = await db.select({
      count: db.$custom<number>`count(*)`
    })
    .from(blogPosts)
    .where(and(
      eq(blogPosts.status, 'published'),
      storeId ? eq(blogPosts.store_id, storeId) : undefined
    ));

    const totalItems = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalItems / pageSize);

    // ブログ投稿の取得（公開済みの投稿のみ）
    const posts = await query
      .orderBy(desc(blogPosts.published_at))
      .limit(pageSize)
      .offset(offset);

    // 店舗名を取得（必要な場合）
    let storeName = undefined;
    if (storeId) {
      const storeResult = await db.query.store_profiles.findFirst({
        where: eq(db.query.store_profiles.id, storeId),
        columns: {
          business_name: true
        }
      });
      storeName = storeResult?.business_name;
    }

    return res.status(200).json({
      posts,
      storeName,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching public blog posts:', error);
    return res.status(500).json({ error: 'ブログ記事の取得中にエラーが発生しました' });
  }
});

// 特定のブログ記事の取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // NaNかどうかチェック
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: '無効なID形式です' });
    }
    
    // 記事の取得
    const post = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: '指定されたブログ記事が見つかりません' });
    }

    // 公開されていない記事へのアクセス制限
    if (post[0].status !== 'published') {
      // 認証済みユーザーで、かつ記事の所有者の場合のみアクセス許可
      if (!req.user || req.user.id !== post[0].store_id) {
        return res.status(403).json({ error: 'この記事にはアクセスできません' });
      }
    }

    // 店舗情報の取得
    const store = await db.query.store_profiles.findFirst({
      where: eq(db.query.store_profiles.id, post[0].store_id),
      columns: {
        business_name: true,
        location: true,
        service_type: true
      }
    });

    return res.status(200).json({
      post: post[0],
      store
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.status(500).json({ error: 'ブログ記事の取得中にエラーが発生しました' });
  }
});

// ブログ記事の作成
router.post('/', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const { title, content, status, scheduled_at, thumbnail, images } = req.body;

    // 公開日時の設定
    let published_at = null;
    if (status === 'published') {
      published_at = new Date();
    }

    // 記事の作成
    const result = await db.insert(blogPosts).values({
      store_id: userId,
      title,
      content,
      status,
      published_at,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      thumbnail,
      images,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ error: 'ブログ記事の作成中にエラーが発生しました' });
  }
});

// ブログ記事の更新
router.put('/:id', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // NaNかどうかチェック
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: '無効なID形式です' });
    }
    const userId = req.user?.id as number;
    const { title, content, status, scheduled_at, thumbnail, images } = req.body;

    // 記事の存在と所有権の確認
    const existingPost = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return res.status(404).json({ error: '指定されたブログ記事が見つかりません' });
    }

    if (existingPost[0].store_id !== userId) {
      return res.status(403).json({ error: 'この記事を編集する権限がありません' });
    }

    // 公開状態の変更処理
    let published_at = existingPost[0].published_at;
    if (status === 'published' && existingPost[0].status !== 'published') {
      published_at = new Date();
    }

    // 記事の更新
    const result = await db.update(blogPosts)
      .set({
        title,
        content,
        status,
        published_at,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
        thumbnail,
        images,
        updated_at: new Date()
      })
      .where(eq(blogPosts.id, postId))
      .returning();

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({ error: 'ブログ記事の更新中にエラーが発生しました' });
  }
});

// ブログ記事の削除
router.delete('/:id', authenticate, authorize('store'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // NaNかどうかチェック
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: '無効なID形式です' });
    }
    const userId = req.user?.id as number;

    // 記事の存在と所有権の確認
    const existingPost = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return res.status(404).json({ error: '指定されたブログ記事が見つかりません' });
    }

    if (existingPost[0].store_id !== userId) {
      return res.status(403).json({ error: 'この記事を削除する権限がありません' });
    }

    // 記事の削除
    await db.delete(blogPosts)
      .where(eq(blogPosts.id, postId));

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ error: 'ブログ記事の削除中にエラーが発生しました' });
  }
});

// ブログ用画像アップロード
router.post('/upload-image', authenticate, authorize('store'), upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '画像が提供されていません' });
    }

    const prefix = 'blog';
    const result = await uploadToS3(req.file.buffer, req.file.originalname, prefix);
    
    return res.status(200).json({
      url: result.url,
      key: result.key
    });
  } catch (error) {
    console.error('Error uploading blog image:', error);
    return res.status(500).json({ error: '画像のアップロード中にエラーが発生しました' });
  }
});

export default router;