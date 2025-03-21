import { Router } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { talentRegisterFormSchema, CupSize, FaceVisibility } from '@shared/schema';
import { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { log } from '../utils/logger';
import passport from 'passport';
import { z } from 'zod';

// ログインスキーマの定義
const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
  role: z.enum(["talent", "store"]).optional(),
});

const router = Router();

// ユーザー情報取得エンドポイント
router.get("/user", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      log('warn', 'ユーザー認証なし');
      return res.status(401).json({ message: "認証が必要です" });
    }

    // データベースから最新のユーザー情報を取得
    const userData = await storage.getUser(user.id);
    if (!userData) {
      log('warn', 'ユーザーが見つかりません', { id: user.id });
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // データベースの値をログ出力
    log('info', 'データベースから取得したユーザー情報', {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      birth_date: userData.birth_date,
      location: userData.location,
      preferred_locations: userData.preferred_locations
    });

    // 必要なユーザー情報のみを返す
    // birth_dateの形式を確認してログ出力
    log('info', '生年月日データ', {
      birth_date: userData.birth_date,
      type: typeof userData.birth_date
    });

    const response = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      birthDate: userData.birth_date, // スネークケースからキャメルケースに変換
      location: userData.location,
      preferredLocations: Array.isArray(userData.preferred_locations) ? userData.preferred_locations : [],
      role: userData.role,
      displayName: userData.username // displayName を username から設定
    };

    // レスポンスデータをログ出力
    log('info', 'クライアントに送信するレスポンス', response);

    res.json(response);
  } catch (error) {
    log('error', 'ユーザー情報取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      message: "ユーザー情報の取得に失敗しました"
    });
  }
});

// ユーザー情報更新エンドポイント
router.patch("/user", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      log('warn', '認証なしでの更新試行');
      return res.status(401).json({ message: "認証が必要です" });
    }

    const { username, location, preferredLocations } = req.body;

    // データベースの更新
    const updatedUser = await storage.updateUser(user.id, {
      username,
      location,
      preferredLocations,
      displayName: username // displayName を username と同期
    });

    // レスポンスデータの形式を統一
    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      birthDate: updatedUser.birth_date, // スネークケースからキャメルケースに変換
      location: updatedUser.location,
      preferredLocations: Array.isArray(updatedUser.preferred_locations) ? updatedUser.preferred_locations : [],
      role: updatedUser.role,
      displayName: updatedUser.username
    };

    res.json(response);
  } catch (error) {
    log('error', 'ユーザー情報更新エラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      message: "ユーザー情報の更新に失敗しました"
    });
  }
});

// 認証エンドポイント
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // リクエストデータのバリデーション（基本的なフォームデータのみ）
    const validatedData = talentRegisterFormSchema.parse(req.body);

    log('info', '登録データバリデーション成功', {
      email: validatedData.email,
      username: validatedData.username,
      birthDate: validatedData.birthDate,
      location: validatedData.location,
      role: validatedData.role || "talent",
    });

    // キャメルケースからスネークケースへの変換（ユーザーテーブル用）
    const userData = {
      email: validatedData.email,
      username: validatedData.username,
      password: validatedData.password,
      birth_date: validatedData.birthDate,
      location: validatedData.location,
      preferred_locations: validatedData.preferredLocations || [],
      role: validatedData.role || "talent",
      display_name: validatedData.username,
    };

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // ユーザーの作成
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });

    // タレントプロフィールの初期作成（ロールがtalentの場合）
    if (user.role === 'talent') {
      try {
        // 簡易登録フォームでは詳細データがないので、デフォルト値を設定
        // 以前は詳細なスキーマを使用していたが、現在は簡易登録フォームを使用
        
        // ログ出力
        log('info', 'プロフィール初期化データ', {
          lastNameKana,
          firstNameKana,
          nearestStation,
          height,
          weight,
          cupSize,
          faceVisibility
        });
        
        // 基本的なプロファイル情報を作成
        const initialProfile = {
          location: user.location || '',
          preferred_locations: user.preferred_locations || [],
          // 登録フォームから姓名（カナ）を設定
          last_name: '',  // 空のまま残し、詳細プロフィール設定時に入力
          first_name: '', // 空のまま残し、詳細プロフィール設定時に入力
          last_name_kana: lastNameKana,
          first_name_kana: firstNameKana,
          nearest_station: nearestStation,
          available_ids: { types: [], others: [] },
          can_provide_residence_record: false,
          height: height,
          weight: weight,
          cup_size: cupSize as "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K", // 型アサーションで明示的に型を指定
          bust: null,
          waist: null,
          hip: null,
          body_mark: { has_body_mark: false, details: '', others: [] },
          smoking: { enabled: false, types: [], others: [] },
          face_visibility: faceVisibility as "全出し" | "口だけ隠し" | "目だけ隠し" | "全隠し", // 型アサーションで明示的に型を指定
          has_esthe_experience: false,
          esthe_experience_period: '',
          esthe_options: { available: [], ng_options: [] },
          current_stores: [],
          previous_stores: [],
          self_introduction: '',
          notes: '',
          ng_locations: [],
          can_photo_diary: false,
          can_home_delivery: false,
          ng_options: { common: [], others: [] },
          allergies: { types: [], others: [], has_allergy: false },
          has_sns_account: false,
          sns_urls: [],
          photo_diary_urls: [],
          photos: []
        };
        
        // タレントプロフィールを作成（ここで生年月日も自動的にコピーされる）
        await storage.createOrUpdateTalentProfile(user.id, initialProfile);
        log('info', 'ユーザー登録時にタレントプロフィールを初期化しました', { userId: user.id });
      } catch (error) {
        // プロフィール作成エラーはログに記録するが、ユーザー登録自体は続行
        log('error', 'タレントプロフィール初期化エラー', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id
        });
      }
    }

    // セッションの作成
    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      res.status(201).json(user);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: "登録処理中にエラーが発生しました",
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// ログインエンドポイント
router.post("/login", async (req, res, next) => {
  try {
    log('info', 'ログインリクエスト受信', {
      email: req.body.email,
      role: req.body.role
    });

    const validatedData = loginSchema.parse(req.body);

    // ユーザーの存在確認と役割の確認
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      log('warn', 'ユーザーが見つかりません', { email: validatedData.email });
      return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
    }

    // ロールの検証
    if (validatedData.role && user.role !== validatedData.role) {
      log('warn', 'ロール不一致', {
        requestedRole: validatedData.role,
        userRole: user.role
      });
      return res.status(403).json({
        message: `このページは${validatedData.role === 'store' ? '店舗' : '女性'}専用のログインページです`
      });
    }

    log('info', 'ユーザー取得成功', {
      email: user.email,
      role: user.role,
      hasPassword: !!user.password
    });

    // パスワード認証
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        log('error', 'パスポート認証エラー', { error: err });
        return next(err);
      }

      if (!user) {
        log('warn', '認証失敗', { message: info?.message });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'セッション作成エラー', { error: err });
          return next(err);
        }

        // セッションにユーザー情報を保存
        if (req.session) {
          req.session.userId = user.id;
          req.session.userRole = user.role;
          req.session.userEmail = user.email;
          req.session.displayName = user.display_name;
        }

        // セッションCookieの設定を強化
        req.session.cookie.secure = process.env.NODE_ENV === 'production';
        req.session.cookie.httpOnly = true;
        req.session.cookie.sameSite = 'lax';

        log('info', 'ログイン成功', {
          userId: user.id,
          email: user.email,
          role: user.role
        });

        res.json(user);
      });
    })(req, res, next);
  } catch (error) {
    log('error', 'ログインエラー', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      message: error instanceof Error ? error.message : "ログインに失敗しました"
    });
  }
});

// ログアウトエンドポイント
router.post("/logout", (req, res) => {
  const userRole = req.user?.role;
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "ログアウトに失敗しました" });
    }
    // セッションを破棄
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.json({ role: userRole });
    });
  });
});

// セッションチェックエンドポイント
router.get("/check", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "認証が必要です" });
  }

  log('info', 'セッションチェック成功', {
    userId: req.user.id,
    role: req.user.role,
    email: req.user.email
  });

  // 必要なユーザー情報のみを返す
  const response = {
    id: req.user.id,
    email: req.user.email,
    username: req.user.username,
    role: req.user.role,
    displayName: req.user.display_name, // スネークケースからキャメルケースに変換
    birthDate: req.user.birth_date, // スネークケースからキャメルケースに変換
    location: req.user.location,
    preferredLocations: req.user.preferred_locations || [] // スネークケースからキャメルケースに変換
  };

  res.json(response);
});

export default router;