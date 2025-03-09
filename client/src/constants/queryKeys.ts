import { QUERY_KEYS as SCHEMA_QUERY_KEYS } from "@shared/schema";

export const QUERY_KEYS = {
  ...SCHEMA_QUERY_KEYS,
  TALENT_PROFILE: "/api/talent/profile",
  USER: "/api/user",
  USER_PROFILE: "/api/user/profile",
  JOBS_PUBLIC: "/api/jobs/public",
  JOBS_SEARCH: "/api/jobs/search",
  JOBS_STORE: "/api/jobs/store",
  JOB_DETAIL: (id: string) => `/api/jobs/${id}`,
  SIGNED_URL: "/api/get-signed-url",
  // ブログ関連のクエリキー
  BLOG_POSTS: "/api/blog/posts",
  BLOG_POST_DETAIL: (id: string) => `/api/blog/posts/${id}`,
  BLOG_POST_STATUS: (id: string) => `/api/blog/posts/${id}/status`,
} as const;