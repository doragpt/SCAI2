export const QUERY_KEYS = {
  TALENT_PROFILE: "/api/talent/profile",
  USER: "/api/user",
  USER_PROFILE: "/api/user/profile",
  JOBS_PUBLIC: "/api/jobs/public",
  JOBS_SEARCH: "/api/jobs/search",
  JOBS_STORE: "/api/jobs/store",
  JOB_DETAIL: (id: string) => `/api/jobs/${id}`,
  SIGNED_URL: "/api/get-signed-url"
} as const;