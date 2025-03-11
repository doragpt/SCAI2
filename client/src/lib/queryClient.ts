import { QueryClient } from "@tanstack/react-query";

// APIのベースURL設定
const API_BASE_URL = '/api';

// APIリクエスト関数
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Server error: ${response.status} ${response.statusText}`
      }));
      throw new Error(errorData.message || "APIリクエストに失敗しました");
    }

    return response;
  } catch (error) {
    console.error('API Request Error:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// クエリキー定数
export const QUERY_KEYS = {
  JOBS_PUBLIC: 'jobs/public',
  TALENT_PROFILE: 'talent/profile',
  USER: 'user',
} as const;

// ジョブ取得クエリ関数
export async function getJobsQuery() {
  const response = await apiRequest('GET', QUERY_KEYS.JOBS_PUBLIC);
  return response.json();
}

// クエリクライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});