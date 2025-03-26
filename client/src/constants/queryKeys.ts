export const QUERY_KEYS = {
  // ユーザー関連
  USER: "/auth/user",
  USER_PROFILE: "/auth/user/profile",

  // 認証関連
  AUTH_CHECK: "/check",
  AUTH_LOGIN: "/auth/login",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_REGISTER: "/auth/register",

  // 店舗関連
  STORE_STATS: "/store/stats",
  STORE_PROFILE: "/store/profile",
  STORE_DESIGN: "/api/design", // 修正: /store/design から /api/design へパスを変更
  DESIGN_SETTINGS: "/api/design", // デザイン設定用

  // タレント関連
  TALENT_PROFILE: "/talent/profile",

  // 求人関連
  JOBS_PUBLIC: "/jobs",
  JOBS_SEARCH: "/jobs",
  JOBS_STORE: "/store/jobs",
  JOB_DETAIL: (id: string | number | null | undefined) => id ? `/jobs/${id}` : '/jobs',

  // 応募関連
  APPLICATIONS_TALENT: "/api/applications/talent",
  APPLICATIONS_STORE: "/api/applications/store",
  APPLICATION_CREATE: "/api/applications",
  
  // アップロード関連
  UPLOAD_PHOTO: "/upload/photo",
  SIGNED_PHOTO_URL: (key: string) => `/upload/signed-url/${key}`,
  
  // その他
  SIGNED_URL: "/storage/get-signed-url",
  BLOG_POSTS: "/blog/posts",
  BLOG_POSTS_STORE: "/api/blog/store-posts",
  BLOG_POST_DETAIL: (id: string) => `/blog/posts/${id}`,
  BLOG_POST_STATUS: (id: string) => `/blog/posts/${id}/status`
} as const;