import { QueryClient } from "@tanstack/react-query";

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

  // JWTトークンをローカルストレージから取得
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Server error: ${response.status} ${response.statusText}`
    }));
    throw new Error(errorData.message || "APIリクエストに失敗しました");
  }

  return response;
}

// クエリキー定数
export const QUERY_KEYS = {
  JOBS_PUBLIC: '/api/jobs/public',
  TALENT_PROFILE: '/api/talent/profile',
  USER: '/api/user',
} as const;

// クエリクライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});