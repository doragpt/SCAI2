import { QueryClient, QueryFunction } from "@tanstack/react-query";
import type { TalentProfileData } from "@shared/schema";

// キャッシュのキー定数
export const QUERY_KEYS = {
  TALENT_PROFILE: "/api/talent/profile",
  USER: "/api/user",
  JOBS: "/api/jobs/public"
} as const;

type UnauthorizedBehavior = "returnNull" | "throw";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

// APIリクエスト用の基本関数
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };

  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || res.statusText);
    }

    return res;
  } catch (error) {
    console.error("API Request Failed:", {
      method,
      url,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// クエリ関数
export const getQueryFn = <T>({
  on401,
}: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const res = await apiRequest("GET", url);

      if (res.status === 401) {
        if (on401 === "returnNull") {
          return null as T;
        }
        throw new Error("認証が必要です");
      }

      const data = await res.json() as T;
      return data;
    } catch (error) {
      console.error("Query Failed:", {
        queryKey,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

// プロフィール更新用の関数
export async function updateTalentProfile(data: Partial<TalentProfileData>) {
  try {
    console.log("Starting profile update:", {
      timestamp: new Date().toISOString(),
      updateData: data
    });

    const response = await apiRequest("PATCH", QUERY_KEYS.TALENT_PROFILE, data);
    const updatedProfile = await response.json() as TalentProfileData;

    // キャッシュの更新
    queryClient.setQueryData<TalentProfileData>([QUERY_KEYS.TALENT_PROFILE], updatedProfile);

    // キャッシュを無効化して強制的に再取得
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
    await queryClient.refetchQueries({
      queryKey: [QUERY_KEYS.TALENT_PROFILE],
      exact: true
    });

    return updatedProfile;
  } catch (error) {
    console.error("Profile update failed:", {
      error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// React Query クライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 2,
      queryFn: getQueryFn({ on401: "throw" }),
    },
    mutations: {
      retry: 1,
    },
  },
});