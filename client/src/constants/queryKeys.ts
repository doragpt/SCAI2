export const QUERY_KEYS = {
  // ユーザー関連
  USER: "/api/user",
  USER_PROFILE: "/api/user/profile",

  // 認証関連
  AUTH_CHECK: "/check",
  AUTH_LOGIN: "/auth/login",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_REGISTER: "/auth/register",

  // 店舗関連
  STORE_STATS: "/api/store/stats", // 追加
  STORE_PROFILE: "/api/store/profile",

  // タレント関連
  TALENT_PROFILE: "/api/talent/profile",

  // 求人関連
  JOBS_PUBLIC: "/api/jobs/public",
  JOBS_SEARCH: "/api/jobs/search",
  JOBS_STORE: "/api/jobs/store",
  JOB_DETAIL: (id: string) => `/api/jobs/${id}`,

  // その他
  SIGNED_URL: "/api/get-signed-url",
  BLOG_POSTS: "/api/blog/posts",
  BLOG_POST_DETAIL: (id: string) => `/api/blog/posts/${id}`,
  BLOG_POST_STATUS: (id: string) => `/api/blog/posts/${id}/status`
} as const;