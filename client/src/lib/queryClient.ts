import { QueryClient } from "@tanstack/react-query";
import type { Job, TalentProfileData, SelectUser } from "@shared/schema";
import { getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

// 共通のエラーハンドリング関数
async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
    }
    throw new Error(data.message || response.statusText);
  }
  return data;
}

// APIリクエスト関数を改善
export async function apiRequest<T>(
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

    // FormDataの場合はContent-Typeを設定しない
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

    const response = await apiRequest<Job[]>("GET", QUERY_KEYS.JOBS_PUBLIC);
    return handleApiResponse<Job[]>(response);
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
    if (params.location && params.location !== "all") searchParams.set("location", params.location);
    if (params.serviceType && params.serviceType !== "all") searchParams.set("serviceType", params.serviceType);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const url = `/api/jobs/public${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    console.log('Fetching jobs:', { url, params });

    const response = await apiRequest("GET", url);
    const data = await handleApiResponse(response);

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

// プロフィール取得・更新関数
export async function getTalentProfile(): Promise<TalentProfileData> {
  const response = await apiRequest("GET", QUERY_KEYS.TALENT_PROFILE);
  return handleApiResponse(response);
}

export async function updateTalentProfile(data: Partial<TalentProfileData>): Promise<TalentProfileData> {
  const response = await apiRequest("PATCH", QUERY_KEYS.TALENT_PROFILE, data);
  return handleApiResponse(response);
}

// ユーザー情報更新関数
export async function updateUserProfile(data: Partial<SelectUser>): Promise<SelectUser> {
  const response = await apiRequest("PATCH", QUERY_KEYS.USER, data);
  return handleApiResponse(response);
}

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