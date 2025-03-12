import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import type { Job, JobListingResponse } from "@shared/schema";

// 開発環境では3000番ポートを使用
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'  // バックエンドのポート
  : '';

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
      timestamp: new Date().toISOString()
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    console.log('Making request to:', fullUrl);

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

// Jobs関連の関数
export async function getJobsQuery(params?: {
  page?: number;
  limit?: number;
  location?: string;
  serviceType?: string;
}): Promise<JobListingResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.location) searchParams.set('location', params.location);
  if (params?.serviceType) searchParams.set('serviceType', params.serviceType);

  const response = await apiRequest("GET", `/api/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  if (!response.ok) {
    throw new Error("求人情報の取得に失敗しました");
  }
  return response.json();
}

// searchJobsQueryをgetJobsQueryのエイリアスとしてエクスポート
export const searchJobsQuery = getJobsQuery;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュ
      retry: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

export { QUERY_KEYS };