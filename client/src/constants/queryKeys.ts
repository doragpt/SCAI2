export const QUERY_KEYS = {
  // 認証関連
  AUTH_CHECK: "/api/auth/check",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_REGISTER: "/api/auth/register",

  // ユーザー関連
  USER: "/api/user",
  USER_PROFILE: "/api/user/profile",

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