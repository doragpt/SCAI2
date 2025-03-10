import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { blogPosts, blogPostSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// ブログ記事一覧取得
router.get("/", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));

    res.json(posts);
  } catch (error) {
    log('error', "ブログ記事一覧取得エラー", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      message: "ブログ記事の取得に失敗しました"
    });
  }
});

// ブログ記事詳細取得
router.get("/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: "無効な記事IDです" });
    }

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));

    if (!post) {
      return res.status(404).json({ message: "記事が見つかりません" });
    }

    if (post.status !== 'published') {
      return res.status(403).json({ message: "この記事は現在非公開です" });
    }

    res.json(post);
  } catch (error) {
    log('error', "ブログ記事詳細取得エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id
    });
    res.status(500).json({
      message: "ブログ記事の取得に失敗しました"
    });
  }
});

// 記事作成（店舗ユーザーのみ）
router.post("/", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'store') {
      return res.status(403).json({ message: "店舗アカウントのみ記事を作成できます" });
    }

    const validatedData = blogPostSchema.parse({
      ...req.body,
      storeId: req.user.id,
      status: 'draft',
      createdAt: new Date()
    });

    const [post] = await db
      .insert(blogPosts)
      .values(validatedData)
      .returning();

    log('info', 'ブログ記事作成成功', {
      userId: req.user.id,
      postId: post.id
    });

    res.status(201).json(post);
  } catch (error) {
    log('error', "ブログ記事作成エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "ブログ記事の作成に失敗しました"
    });
  }
});

export default router;
