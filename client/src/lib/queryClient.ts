import { QueryClient } from "@tanstack/react-query";
import type { Job } from "@shared/schema";
import { getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

// APIリクエスト関数を改善
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<Response> {
  try {
    console.log('API Request starting:', {
      method,
      url,
      hasData: !!data,
      timestamp: new Date().toISOString()
    });

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    if (data instanceof FormData) {
      delete headers["Content-Type"];
    }

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log('API Response received:', {
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error('API Request Error:', {
      method,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// 求人一覧取得用のクエリ関数
export const getJobsQuery = async (): Promise<Job[]> => {
  try {
    console.log('Fetching public jobs:', {
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest("GET", QUERY_KEYS.JOBS_PUBLIC);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Jobs fetch error:', {
      error: getErrorMessage(error),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// クエリクライアントの設定を改善
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: (failureCount, error) => {
        // 認証エラーの場合はリトライしない
        if (error instanceof Error && error.message.includes("401")) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

export { QUERY_KEYS };