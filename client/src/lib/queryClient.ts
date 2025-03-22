import { QueryClient } from "@tanstack/react-query";
import type { TalentProfileData, SelectUser } from "@shared/schema";
import { getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

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

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // セッションCookieを送信
    });

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

// タレントプロフィール関連の関数
export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<TalentProfileData> {
  const response = await apiRequest(
    "POST",
    QUERY_KEYS.TALENT_PROFILE,
    data
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "プロフィールの保存に失敗しました");
  }

  return response.json();
}

export async function getTalentProfile(): Promise<TalentProfileData> {
  const response = await apiRequest("GET", QUERY_KEYS.TALENT_PROFILE);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "プロフィールの取得に失敗しました");
  }

  return response.json();
}

export function invalidateTalentProfileCache() {
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}

// 求人一覧取得用のクエリ関数
export const getJobsQuery = async (): Promise<any[]> => {
  try {
    console.log('Fetching jobs data...');

    const response = await apiRequest("GET", QUERY_KEYS.JOBS_PUBLIC);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "求人の取得に失敗しました");
    }
    return response.json();
  } catch (error) {
    console.error('求人情報取得エラー:', error);
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
  jobs: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}> => {
  try {
    const searchParams = new URLSearchParams();
    if (params.location && params.location !== "all") searchParams.set("location", params.location);
    if (params.serviceType && params.serviceType !== "all") searchParams.set("serviceType", params.serviceType);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const url = `${QUERY_KEYS.JOBS_SEARCH}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    console.log('Fetching jobs:', { url, params });

    const response = await apiRequest("GET", url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "求人の検索に失敗しました");
    }
    const data = await response.json();

    // レスポンスをページネーション形式に整形
    return {
      jobs: data,
      pagination: {
        currentPage: params.page || 1,
        totalPages: Math.ceil(data.length / (params.limit || 12)),
        totalItems: data.length
      }
    };
  } catch (error) {
    console.error('Jobs search error:', {
      error: getErrorMessage(error),
      params,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};


// ユーザー情報更新関数
export async function updateUserProfile(data: any): Promise<any> {
  const response = await apiRequest("PATCH", "/auth/user", data);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "ユーザー情報の更新に失敗しました");
  }

  return response.json();
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