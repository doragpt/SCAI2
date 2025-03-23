import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { blogPosts, blogPostSchema } from '@shared/schema';
import { eq, desc, and, like, sql, asc } from 'drizzle-orm';
import { log } from '../utils/logger';

const router = Router();

// 店舗ユーザー向け：自分のブログ記事一覧取得（フィルター/ページネーション機能付き）
// このエンドポイントを最初に配置して、:id パラメータと競合しないようにする
// リクエストパスは `/api/blog/store-posts` となる
router.get("/store-posts", authenticate, async (req: any, res) => {
  log('info', '店舗ブログ記事一覧リクエスト開始', {
    userId: req.user?.id,
    userRole: req.user?.role,
    query: req.query,
    path: req.path
  });

  try {
    // 店舗ユーザーのみアクセス可能
    if (req.user.role !== 'store') {
      log('warn', '店舗ブログ記事アクセス権限なし', {
        userId: req.user?.id,
        userRole: req.user?.role
      });
      return res.status(403).json({ message: "店舗アカウントのみアクセスできます" });
    }

    const storeId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    
    log('info', '店舗ブログ記事検索パラメータ', {
      storeId,
      page,
      limit,
      offset,
      status,
      search
    });

    // フィルター条件の構築
    let conditions = [eq(blogPosts.store_id, storeId)];
    
    if (status) {
      conditions.push(sql`${blogPosts.status} = ${status}`);
    }
    
    if (search) {
      conditions.push(like(blogPosts.title, `%${search}%`));
    }

    // 総件数の取得
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(and(...conditions));
    
    const totalItems = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 記事の取得
    const posts = await db
      .select()
      .from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.created_at))
      .limit(limit)
      .offset(offset);
    
    log('info', '店舗ブログ記事一覧取得成功', {
      userId: req.user.id,
      postsCount: posts.length,
      totalItems
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
      }
    });
  } catch (error) {
    log('error', "店舗ブログ記事一覧取得エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "ブログ記事の取得に失敗しました"
    });
  }
});

// ブログ記事一覧取得
router.get("/", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.published_at));

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
router.get("/:id", authenticate, async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      log('warn', "無効な記事ID", { id: req.params.id });
      return res.status(400).json({ message: "無効な記事IDです" });
    }

    log('info', "ブログ記事詳細取得リクエスト", {
      userId: req.user?.id,
      userRole: req.user?.role,
      postId: postId
    });

    // 記事の取得
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));

    // 記事が存在しない場合
    if (!post) {
      log('warn', "ブログ記事が見つかりません", { 
        postId: postId,
        userId: req.user?.id 
      });
      return res.status(404).json({ message: "記事が見つかりません" });
    }

    console.log(`ブログ記事データ取得完了 ID:${postId}`, JSON.stringify(post, null, 2));

    // アクセス権限チェック
    const isOwner = req.user && req.user.role === 'store' && post.store_id === req.user.id;
    const isPublished = post.status === 'published';

    log('info', "ブログ記事アクセス権限チェック", {
      isOwner, 
      isPublished,
      postId: post.id,
      postStoreId: post.store_id,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    // 店舗ユーザーの自分の記事か、公開済みの記事のみアクセス可能
    if (isOwner || isPublished) {
      log('info', "ブログ記事詳細取得成功", { 
        postId: post.id,
        userId: req.user?.id,
        isOwner: isOwner,
        postStatus: post.status 
      });
      return res.json(post);
    }

    // 非公開記事で所有者でない場合
    log('warn', "ブログ記事へのアクセス権限なし", { 
      postId: post.id,
      userId: req.user?.id,
      postStatus: post.status 
    });
    return res.status(403).json({ message: "この記事は現在非公開です" });
  } catch (error) {
    log('error', "ブログ記事詳細取得エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
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

    // 日付データの適切な処理
    let scheduled_at = null;
    if (req.body.scheduled_at) {
      try {
        scheduled_at = new Date(req.body.scheduled_at);
      } catch (e) {
        console.error('Invalid scheduled_at date:', req.body.scheduled_at);
      }
    }
    
    let published_at = null;
    if (req.body.published_at) {
      try {
        published_at = new Date(req.body.published_at);
      } catch (e) {
        console.error('Invalid published_at date:', req.body.published_at);
      }
    }

    const validatedData = blogPostSchema.parse({
      ...req.body,
      store_id: req.user.id,
      status: req.body.status || 'draft',
      scheduled_at: scheduled_at,
      published_at: published_at,
      created_at: new Date(),
      updated_at: new Date()
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

// この重複したエンドポイントは削除しました

// 記事更新（店舗ユーザーのみ）
router.put("/:id", authenticate, async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: "無効な記事IDです" });
    }

    // 店舗ユーザーのみ更新可能
    if (req.user.role !== 'store') {
      return res.status(403).json({ message: "店舗アカウントのみ記事を更新できます" });
    }

    // 記事の存在確認と所有権チェック
    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.id, postId),
        eq(blogPosts.store_id, req.user.id)
      ));

    if (!existingPost) {
      return res.status(404).json({ message: "記事が見つからないか、アクセス権限がありません" });
    }

    // 日付データの適切な処理
    let scheduled_at = null;
    if (req.body.scheduled_at) {
      try {
        scheduled_at = new Date(req.body.scheduled_at);
      } catch (e) {
        console.error('Invalid scheduled_at date:', req.body.scheduled_at);
      }
    }
    
    let published_at = null;
    if (req.body.published_at) {
      try {
        published_at = new Date(req.body.published_at);
      } catch (e) {
        console.error('Invalid published_at date:', req.body.published_at);
      }
    }
    
    // 更新データの検証
    const validatedData = {
      ...req.body,
      scheduled_at: scheduled_at,
      published_at: published_at,
      updated_at: new Date()
    };
    
    // デバッグ用ログ
    console.log('更新データ:', JSON.stringify({
      id: validatedData.id,
      title: validatedData.title,
      status: validatedData.status,
      scheduled_at: validatedData.scheduled_at,
      published_at: validatedData.published_at
    }));

    // 記事の更新
    const [updatedPost] = await db
      .update(blogPosts)
      .set(validatedData)
      .where(and(
        eq(blogPosts.id, postId),
        eq(blogPosts.store_id, req.user.id)
      ))
      .returning();

    log('info', 'ブログ記事更新成功', {
      userId: req.user.id,
      postId: updatedPost.id
    });

    res.json(updatedPost);
  } catch (error) {
    log('error', "ブログ記事更新エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      postId: req.params.id
    });
    res.status(500).json({
      message: "ブログ記事の更新に失敗しました"
    });
  }
});

// 記事削除（店舗ユーザーのみ）
router.delete("/:id", authenticate, async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: "無効な記事IDです" });
    }

    // 店舗ユーザーのみ削除可能
    if (req.user.role !== 'store') {
      return res.status(403).json({ message: "店舗アカウントのみ記事を削除できます" });
    }

    // 記事の存在確認と所有権チェック
    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.id, postId),
        eq(blogPosts.store_id, req.user.id)
      ));

    if (!existingPost) {
      return res.status(404).json({ message: "記事が見つからないか、アクセス権限がありません" });
    }

    // 記事の削除
    await db
      .delete(blogPosts)
      .where(and(
        eq(blogPosts.id, postId),
        eq(blogPosts.store_id, req.user.id)
      ));

    log('info', 'ブログ記事削除成功', {
      userId: req.user.id,
      postId
    });

    res.json({ message: "記事を削除しました" });
  } catch (error) {
    log('error', "ブログ記事削除エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      postId: req.params.id
    });
    res.status(500).json({
      message: "ブログ記事の削除に失敗しました"
    });
  }
});

export default router;
