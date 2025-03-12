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
export async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<T> {
  try {
    console.log('API Request starting:', {
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
      credentials: "include",
    });

    console.log('API Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    console.log('API Response data:', responseData);
    return responseData as T;
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

// タレントプロフィール関連の関数
export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<TalentProfileData> {
  console.log('Creating/Updating talent profile:', data);
  const response = await apiRequest<TalentProfileData>(
    "POST",
    QUERY_KEYS.TALENT_PROFILE,
    data
  );
  console.log('Profile update response:', response);
  return response;
}

export async function getTalentProfile(): Promise<TalentProfileData> {
  console.log('Getting talent profile');
  const response = await apiRequest<TalentProfileData>("GET", QUERY_KEYS.TALENT_PROFILE);
  console.log('Got talent profile:', response);
  return response;
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
    return response;
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

    const response = await apiRequest<{ jobs: import("@shared/schema").Job[]; pagination: { currentPage: number; totalPages: number; totalItems: number; } }>("GET", url);
    return response;
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
  const response = await apiRequest<any>("PATCH", "/api/user", data);
  return response;
}

// クエリクライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // キャッシュを無効化して常に最新データを取得
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

export { QUERY_KEYS };