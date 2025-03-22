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

  // タレント関連
  TALENT_PROFILE: "/api/talent/profile",

  // 求人関連
  JOBS_PUBLIC: "/jobs",
  JOBS_SEARCH: "/jobs",
  JOBS_STORE: "/store/jobs",
  JOB_DETAIL: (id: string) => `/jobs/${id}`,

  // その他
  SIGNED_URL: "/storage/get-signed-url",
  BLOG_POSTS: "/blog/posts",
  BLOG_POST_DETAIL: (id: string) => `/blog/posts/${id}`,
  BLOG_POST_STATUS: (id: string) => `/blog/posts/${id}/status`
} as const;