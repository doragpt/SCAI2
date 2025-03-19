import { QueryClient } from "@tanstack/react-query";
import type { TalentProfileData } from "@shared/schema";
import { getErrorMessage } from "@/lib/utils";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

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
    log('info', 'APIリクエスト開始', {
      method,
      url,
      data,
      timestamp: new Date().toISOString()
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    const requestOptions = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include" as RequestCredentials,
    };

    log('info', 'リクエスト設定', requestOptions);

    const response = await fetch(fullUrl, requestOptions);

    if (!response.ok) {
      log('error', 'APIリクエストエラー', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl
      });

      const error = await response.json();
      throw new Error(error.message || "APIリクエストに失敗しました");
    }

    return response;
  } catch (error) {
    log('error', 'APIリクエストエラー', {
      method,
      url,
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
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// デバッグ用のログ関数
function log(level: 'info' | 'error', message: string, data?: any) {
  const logData = {
    level,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(logData));
}

export { QUERY_KEYS };