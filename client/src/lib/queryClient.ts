import { QueryClient } from "@tanstack/react-query";
import type { UserResponse } from "@shared/schema";
import { getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

// APIリクエスト関数の強化
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<Response> {
  try {
    console.log('APIリクエスト開始', {
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
      credentials: "include" as const,
    };

    const response = await fetch(fullUrl, requestOptions);

    if (!response.ok) {
      console.error('APIリクエストエラー', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        timestamp: new Date().toISOString()
      });

      const error = await response.json();
      throw new Error(error.message || "APIリクエストに失敗しました");
    }

    return response;
  } catch (error) {
    console.error('APIリクエストエラー', {
      method,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// タレントプロフィール関連の関数
export async function createOrUpdateTalentProfile(data: any): Promise<any> { //Type needs clarification from original code
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

export async function getTalentProfile(): Promise<any> { //Type needs clarification from original code
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
export const getJobsQuery = async (): Promise<import("@shared/schema").Job[]> => {
  try {
    console.log('Fetching public jobs:', {
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest<import("@shared/schema").Job[]>("GET", QUERY_KEYS.JOBS_PUBLIC);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "求人の取得に失敗しました");
    }
    return response.json();
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
  jobs: import("@shared/schema").Job[];
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

    const url = `/api/jobs/public${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
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


// ユーザー情報取得関数
export async function getUserProfile(): Promise<UserResponse> {
  console.log('ユーザー情報取得開始');

  const response = await apiRequest("GET", QUERY_KEYS.USER);
  const data = await response.json();

  console.log('ユーザー情報取得成功:', data);
  return data as UserResponse;
}

// ユーザー情報更新関数
export async function updateUserProfile(data: Partial<UserResponse>): Promise<UserResponse> {
  console.log('ユーザー情報更新開始:', data);

  const response = await apiRequest("PATCH", QUERY_KEYS.USER, data);
  const updatedData = await response.json();

  console.log('ユーザー情報更新成功:', updatedData);
  return updatedData as UserResponse;
}

// クエリクライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  }
});

export { QUERY_KEYS };