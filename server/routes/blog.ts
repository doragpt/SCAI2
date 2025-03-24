import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { blogPosts, blogPostSchema } from '@shared/schema';
import { eq, desc, and, like, sql, asc } from 'drizzle-orm';
import { log } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// 公開状態の記事でpublished_atが設定されていないレコードを修正するユーティリティエンドポイント
router.post("/fix-published-dates", authenticate, async (req: any, res) => {
  try {
    // 店舗ユーザーのみアクセス可能
    if (req.user.role !== 'store') {
      return res.status(403).json({ message: "店舗アカウントのみアクセスできます" });
    }

    // 公開状態だけどpublished_atがnullの記事を検索
    const posts = await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.store_id, req.user.id),
        eq(blogPosts.status, 'published'),
        sql`${blogPosts.published_at} IS NULL`
      ));

    log('info', '公開日未設定の記事検索結果', {
      userId: req.user.id,
      postsCount: posts.length
    });

    if (posts.length === 0) {
      return res.json({ message: "修正が必要な記事はありません", fixedCount: 0 });
    }

    // それぞれの記事を修正
    const now = new Date();
    const results = await Promise.all(posts.map(async (post) => {
      const [updated] = await db
        .update(blogPosts)
        .set({ published_at: now })
        .where(eq(blogPosts.id, post.id))
        .returning();
      return updated;
    }));

    log('info', '公開日未設定記事の修正完了', {
      userId: req.user.id,
      fixedCount: results.length
    });

    res.json({
      message: `${results.length}件の記事の公開日を修正しました`,
      fixedCount: results.length,
      fixedPosts: results
    });
  } catch (error) {
    log('error', "公開日修正エラー", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "記事の公開日修正に失敗しました"
    });
  }
});

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

    // 記事の取得 - 公開日時 > 予約投稿日時 > 作成日時の優先順でソート
    const posts = await db
      .select()
      .from(blogPosts)
      .where(and(...conditions))
      // 複数条件での並び替え: 公開記事は公開日時、予約投稿は予定日時、下書きは作成日時で新しい順にソート
      .orderBy(
        sql`CASE 
          WHEN ${blogPosts.status} = 'published' THEN ${blogPosts.published_at}
          WHEN ${blogPosts.status} = 'scheduled' THEN ${blogPosts.scheduled_at}
          ELSE ${blogPosts.created_at}
        END DESC NULLS LAST`
      )
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

    // ユーザーによってセットされた日付はstring型であることがほとんどなので、
    // 手動で適切な形式に変換する
    let cleanedData = { ...req.body };
    
    // 日付データ変換の厳密な処理
    console.log('変換前データ:', {
      scheduled_at_type: typeof cleanedData.scheduled_at,
      scheduled_at_value: cleanedData.scheduled_at,
      published_at_type: typeof cleanedData.published_at,
      published_at_value: cleanedData.published_at
    });
    
    try {
      // scheduled_at の処理
      if (cleanedData.scheduled_at) {
        if (typeof cleanedData.scheduled_at === 'string') {
          // 文字列から正しくDateオブジェクトに変換
          cleanedData.scheduled_at = new Date(cleanedData.scheduled_at);
          console.log('文字列からDate変換 scheduled_at:', cleanedData.scheduled_at);
        } else if (cleanedData.scheduled_at instanceof Date) {
          // すでにDateオブジェクトの場合はそのまま
          console.log('既存のDate scheduled_at:', cleanedData.scheduled_at);
        } else {
          // 不明な型の場合はnullに設定
          console.log('不明な型の scheduled_at:', typeof cleanedData.scheduled_at);
          cleanedData.scheduled_at = null;
        }
      } else {
        // nullまたはundefinedの場合
        cleanedData.scheduled_at = null;
      }
      
      // published_at の処理
      if (cleanedData.published_at) {
        if (typeof cleanedData.published_at === 'string') {
          // 文字列から正しくDateオブジェクトに変換
          cleanedData.published_at = new Date(cleanedData.published_at);
          console.log('文字列からDate変換 published_at:', cleanedData.published_at);
        } else if (cleanedData.published_at instanceof Date) {
          // すでにDateオブジェクトの場合はそのまま
          console.log('既存のDate published_at:', cleanedData.published_at);
        } else {
          // 不明な型の場合はnullに設定
          console.log('不明な型の published_at:', typeof cleanedData.published_at);
          cleanedData.published_at = null;
        }
      } else {
        // nullまたはundefinedの場合
        cleanedData.published_at = null;
      }
    } catch (dateError) {
      console.error('日付処理エラー:', dateError);
      // 変換に失敗した場合は両方nullにする
      cleanedData.scheduled_at = null;
      cleanedData.published_at = null;
    }
    
    // スタータス設定と必須フィールド
    cleanedData.status = cleanedData.status || 'draft';
    cleanedData.store_id = req.user.id;
    cleanedData.created_at = new Date();
    cleanedData.updated_at = new Date();
    
    // JSONデータをデバッグログに出力
    console.log('作成用データ:', {
      title: cleanedData.title,
      status: cleanedData.status,
      scheduled_at: cleanedData.scheduled_at instanceof Date 
        ? cleanedData.scheduled_at.toISOString() 
        : cleanedData.scheduled_at,
      published_at: cleanedData.published_at instanceof Date 
        ? cleanedData.published_at.toISOString() 
        : cleanedData.published_at
    });
    
    // cleanedDataをDBで安全に使用できる形式に変換
    // scheduled_atとpublished_atの最終確認
    if (cleanedData.scheduled_at && !(cleanedData.scheduled_at instanceof Date)) {
      try {
        cleanedData.scheduled_at = new Date(cleanedData.scheduled_at);
      } catch (e) {
        console.error('最終変換でエラー - scheduled_at:', cleanedData.scheduled_at);
        cleanedData.scheduled_at = null;
      }
    }
    
    if (cleanedData.published_at && !(cleanedData.published_at instanceof Date)) {
      try {
        cleanedData.published_at = new Date(cleanedData.published_at);
      } catch (e) {
        console.error('最終変換でエラー - published_at:', cleanedData.published_at);
        cleanedData.published_at = null;
      }
    }
    
    // 直接SQLパラメータとして使用する安全なオブジェクトを作成
    const safeData = {
      title: cleanedData.title,
      content: cleanedData.content,
      status: cleanedData.status,
      store_id: cleanedData.store_id,
      scheduled_at: cleanedData.scheduled_at,
      published_at: cleanedData.published_at,
      created_at: cleanedData.created_at,
      updated_at: cleanedData.updated_at,
      thumbnail: cleanedData.thumbnail,
      images: cleanedData.images
    };
    
    console.log('DB挿入用の安全なデータ型:', {
      scheduled_at_type: safeData.scheduled_at ? (safeData.scheduled_at instanceof Date ? 'Date' : typeof safeData.scheduled_at) : 'null',
      published_at_type: safeData.published_at ? (safeData.published_at instanceof Date ? 'Date' : typeof safeData.published_at) : 'null'
    });
    
    try {
      const [post] = await db
        .insert(blogPosts)
        .values(safeData)
        .returning();

      log('info', 'ブログ記事作成成功', {
        userId: req.user.id,
        postId: post.id
      });

      res.status(201).json(post);
    } catch (dbError) {
      console.error('データベース挿入エラー:', dbError);
      throw dbError; // 外側のcatchで処理するために再スロー
    }
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

    // ユーザーによってセットされた日付はstring型であることがほとんどなので、
    // 手動で適切な形式に変換する
    let cleanedData = { ...req.body };
    
    // 日付データ変換の厳密な処理
    console.log('変換前データ:', {
      scheduled_at_type: typeof cleanedData.scheduled_at,
      scheduled_at_value: cleanedData.scheduled_at,
      published_at_type: typeof cleanedData.published_at,
      published_at_value: cleanedData.published_at
    });
    
    try {
      // scheduled_at の処理
      if (cleanedData.scheduled_at) {
        if (typeof cleanedData.scheduled_at === 'string') {
          // 文字列から正しくDateオブジェクトに変換
          cleanedData.scheduled_at = new Date(cleanedData.scheduled_at);
          console.log('文字列からDate変換 scheduled_at:', cleanedData.scheduled_at);
        } else if (cleanedData.scheduled_at instanceof Date) {
          // すでにDateオブジェクトの場合はそのまま
          console.log('既存のDate scheduled_at:', cleanedData.scheduled_at);
        } else {
          // 不明な型の場合はnullに設定
          console.log('不明な型の scheduled_at:', typeof cleanedData.scheduled_at);
          cleanedData.scheduled_at = null;
        }
      } else {
        // nullまたはundefinedの場合
        cleanedData.scheduled_at = null;
      }
      
      // published_at の処理
      if (cleanedData.published_at) {
        if (typeof cleanedData.published_at === 'string') {
          // 文字列から正しくDateオブジェクトに変換
          cleanedData.published_at = new Date(cleanedData.published_at);
          console.log('文字列からDate変換 published_at:', cleanedData.published_at);
        } else if (cleanedData.published_at instanceof Date) {
          // すでにDateオブジェクトの場合はそのまま
          console.log('既存のDate published_at:', cleanedData.published_at);
        } else {
          // 不明な型の場合はnullに設定
          console.log('不明な型の published_at:', typeof cleanedData.published_at);
          cleanedData.published_at = null;
        }
      } else {
        // nullまたはundefinedの場合
        cleanedData.published_at = null;
      }
    } catch (dateError) {
      console.error('日付処理エラー:', dateError);
      // 変換に失敗した場合は両方nullにする
      cleanedData.scheduled_at = null;
      cleanedData.published_at = null;
    }
    
    // 更新日時を設定
    cleanedData.updated_at = new Date();
    
    // 不要なフィールドを除去
    delete cleanedData.id; // idはパラメータから取得するので除去
    
    // JSONデータをデバッグログに出力
    console.log('更新用データ:', {
      id: postId,
      title: cleanedData.title,
      status: cleanedData.status,
      scheduled_at: cleanedData.scheduled_at instanceof Date 
        ? cleanedData.scheduled_at.toISOString() 
        : cleanedData.scheduled_at,
      published_at: cleanedData.published_at instanceof Date 
        ? cleanedData.published_at.toISOString() 
        : cleanedData.published_at
    });
    
    // cleanedDataをDBで安全に使用できる形式に変換
    // scheduled_atとpublished_atの最終確認
    if (cleanedData.scheduled_at && !(cleanedData.scheduled_at instanceof Date)) {
      try {
        cleanedData.scheduled_at = new Date(cleanedData.scheduled_at);
      } catch (e) {
        console.error('最終変換でエラー - scheduled_at:', cleanedData.scheduled_at);
        cleanedData.scheduled_at = null;
      }
    }
    
    if (cleanedData.published_at && !(cleanedData.published_at instanceof Date)) {
      try {
        cleanedData.published_at = new Date(cleanedData.published_at);
      } catch (e) {
        console.error('最終変換でエラー - published_at:', cleanedData.published_at);
        cleanedData.published_at = null;
      }
    }
    
    // 公開状態の場合は必ず公開日時を設定
    if (cleanedData.status === 'published' && !cleanedData.published_at) {
      cleanedData.published_at = new Date();
    }

    // 直接SQLパラメータとして使用する安全なオブジェクトを作成
    const safeData = {
      title: cleanedData.title,
      content: cleanedData.content,
      status: cleanedData.status,
      scheduled_at: cleanedData.scheduled_at,
      published_at: cleanedData.published_at,
      updated_at: new Date(),
      thumbnail: cleanedData.thumbnail,
      images: cleanedData.images
    };
    
    console.log('DB更新用の安全なデータ型:', {
      scheduled_at_type: safeData.scheduled_at ? (safeData.scheduled_at instanceof Date ? 'Date' : typeof safeData.scheduled_at) : 'null',
      published_at_type: safeData.published_at ? (safeData.published_at instanceof Date ? 'Date' : typeof safeData.published_at) : 'null'
    });
    
    // 記事の更新
    try {
      const [updatedPost] = await db
        .update(blogPosts)
        .set(safeData)
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
    } catch (dbError) {
      console.error('データベース更新エラー:', dbError);
      throw dbError; // 外側のcatchで処理するために再スロー
    }
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

// [新規追加] ブログ記事作成/更新（クライアントからのAPI repath対応）
router.post("/post", authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'store') {
      return res.status(403).json({ message: "店舗アカウントのみ記事を作成できます" });
    }

    // 既存のブログ作成APIエンドポイントと同様の処理
    let cleanedData = { ...req.body };
    
    try {
      // scheduled_atとpublished_atの処理
      if (cleanedData.scheduled_at) {
        cleanedData.scheduled_at = new Date(cleanedData.scheduled_at);
      } else {
        cleanedData.scheduled_at = null;
      }
      
      if (cleanedData.published_at) {
        cleanedData.published_at = new Date(cleanedData.published_at);
      } else {
        cleanedData.published_at = null;
      }
    } catch (dateError) {
      console.error('日付処理エラー:', dateError);
      cleanedData.scheduled_at = null;
      cleanedData.published_at = null;
    }
    
    // 公開時は公開日時を設定
    if (cleanedData.status === 'published' && !cleanedData.published_at) {
      cleanedData.published_at = new Date();
    }
    
    // その他の必須フィールド
    cleanedData.store_id = req.user.id;
    cleanedData.created_at = new Date();
    cleanedData.updated_at = new Date();
    
    log('info', 'ブログ記事作成リクエスト(repath API)', {
      userId: req.user.id,
      status: cleanedData.status,
      title: cleanedData.title
    });

    const [post] = await db
      .insert(blogPosts)
      .values(cleanedData)
      .returning();

    log('info', 'ブログ記事作成成功(repath API)', {
      userId: req.user.id,
      postId: post.id
    });

    res.status(201).json(post);
  } catch (error) {
    log('error', "ブログ記事作成エラー(repath API)", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    res.status(500).json({
      message: "ブログ記事の作成に失敗しました"
    });
  }
});

// [新規追加] ブログ記事更新（クライアントからのAPI repath対応）
router.patch("/post/:id", authenticate, async (req: any, res) => {
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

    let cleanedData = { ...req.body };
    
    try {
      // scheduled_atとpublished_atの処理
      if (cleanedData.scheduled_at) {
        cleanedData.scheduled_at = new Date(cleanedData.scheduled_at);
      } else {
        cleanedData.scheduled_at = null;
      }
      
      if (cleanedData.published_at) {
        cleanedData.published_at = new Date(cleanedData.published_at);
      } else {
        cleanedData.published_at = null;
      }
    } catch (dateError) {
      console.error('日付処理エラー:', dateError);
      cleanedData.scheduled_at = null;
      cleanedData.published_at = null;
    }
    
    // 公開時は必ず公開日時を設定
    if (cleanedData.status === 'published' && !cleanedData.published_at) {
      cleanedData.published_at = new Date();
    }
    
    // 更新日時を設定
    cleanedData.updated_at = new Date();
    
    // 不要なフィールドを除去
    delete cleanedData.id;
    delete cleanedData.store_id;
    delete cleanedData.created_at;
    
    log('info', 'ブログ記事更新リクエスト(repath API)', {
      userId: req.user.id,
      postId: postId,
      status: cleanedData.status,
      title: cleanedData.title
    });

    // 記事の更新
    const [updatedPost] = await db
      .update(blogPosts)
      .set(cleanedData)
      .where(and(
        eq(blogPosts.id, postId),
        eq(blogPosts.store_id, req.user.id)
      ))
      .returning();

    log('info', 'ブログ記事更新成功(repath API)', {
      userId: req.user.id,
      postId: updatedPost.id
    });

    res.json(updatedPost);
  } catch (error) {
    log('error', "ブログ記事更新エラー(repath API)", {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      postId: req.params.id
    });
    res.status(500).json({
      message: "ブログ記事の更新に失敗しました"
    });
  }
});

export default router;
