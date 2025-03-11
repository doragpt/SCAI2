import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
})();

// トークンの取得
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// APIリクエスト関数
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<Response> {
  try {
    console.log('[API Request]:', {
      method,
      url,
      data,
      timestamp: new Date().toISOString()
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // 認証トークンの追加
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log('[API Response]:', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error('[API Error]:', {
      method,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// タレントプロフィール関連の関数
export async function getTalentProfile(): Promise<any | null> {
  try {
    const response = await apiRequest("GET", "/talent/profile");

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Server error: ${response.status} ${response.statusText}`
      }));
      throw new Error(errorData.message || "プロフィールの取得に失敗しました");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Profile fetch error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
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

export { QUERY_KEYS };