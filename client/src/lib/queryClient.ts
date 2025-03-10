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

// CSRFトークンを取得する関数
async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('CSRF token fetch error:', error);
    throw new Error('Failed to fetch CSRF token');
  }
}

// APIリクエスト関数を改善
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
    retry?: boolean;
  }
): Promise<Response> {
  try {
    console.log('API Request starting:', {
      method,
      url,
      hasData: !!data,
      timestamp: new Date().toISOString()
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // 認証トークンの追加
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // GET以外のリクエストにCSRFトークンを追加
    if (method !== 'GET') {
      try {
        const csrfToken = await fetchCsrfToken();
        headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        throw new Error('CSRF token fetch failed');
      }
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

    // CSRFトークンエラーの場合、リトライを試みる
    if (response.status === 403 && options?.retry !== false) {
      const errorData = await response.json();
      if (errorData.message === 'Invalid CSRF token') {
        console.log('Retrying request with new CSRF token');
        return apiRequest(method, url, data, { ...options, retry: false });
      }
    }

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

// 求人検索用のクエリ関数
export const searchJobsQuery = async (params: {
  location?: string;
  serviceType?: string;
  page?: number;
  limit?: number;
}): Promise<{
  jobs: Job[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}> => {
  try {
    const searchParams = new URLSearchParams();
    if (params.location) searchParams.set("location", params.location);
    if (params.serviceType) searchParams.set("serviceType", params.serviceType);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const url = `${QUERY_KEYS.JOBS_SEARCH}?${searchParams.toString()}`;
    const response = await apiRequest("GET", url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Jobs search error:', {
      error: getErrorMessage(error),
      params,
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