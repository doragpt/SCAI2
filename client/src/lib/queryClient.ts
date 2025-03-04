import { QueryClient, QueryFunction } from "@tanstack/react-query";
import type { TalentProfileData } from "@shared/schema";

// キャッシュのキー定数
export const QUERY_KEYS = {
  TALENT_PROFILE: "/api/talent/profile",
} as const;

type UnauthorizedBehavior = "returnNull" | "throw";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    console.error("API Error:", {
      status: res.status,
      statusText: res.statusText,
      data,
      url: res.url,
      timestamp: new Date().toISOString()
    });
    throw new Error(data.message || res.statusText);
  }
}

// Query Function の定義
export const getQueryFn = <T>({
  on401,
}: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {
      "X-Requested-With": "XMLHttpRequest"
    };

    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = queryKey[0] as string;
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    try {
      // プロフィールデータの場合、まずローカルストレージをチェック
      if (url === QUERY_KEYS.TALENT_PROFILE) {
        const cachedProfile = localStorage.getItem('talentProfile');
        if (cachedProfile) {
          const profileData = JSON.parse(cachedProfile) as T;
          console.log("Using cached profile data:", {
            timestamp: new Date().toISOString(),
            type: typeof profileData,
            keys: Object.keys(profileData)
          });
          return profileData;
        }
      }

      const res = await fetch(fullUrl, {
        headers,
        credentials: "include",
      });

      if (on401 === "returnNull" && res.status === 401) {
        return null as T;
      }

      await throwIfResNotOk(res);
      const data = await res.json() as T;

      // プロフィールデータの場合はローカルストレージに保存
      if (url === QUERY_KEYS.TALENT_PROFILE && data) {
        localStorage.setItem('talentProfile', JSON.stringify(data));
        console.log("Updated cached profile data:", {
          timestamp: new Date().toISOString(),
          type: typeof data,
          keys: Object.keys(data)
        });
      }

      return data;
    } catch (error) {
      console.error("Query Failed:", {
        url: fullUrl,
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

  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API Request Failed:", {
      method,
      url: fullUrl,
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

// プロフィール更新用の関数
export async function updateTalentProfile(data: Partial<TalentProfileData>) {
  try {
    console.log("Starting profile update:", {
      timestamp: new Date().toISOString(),
      updateData: data
    });

    // 既存のデータを取得
    const existingProfile = queryClient.getQueryData<TalentProfileData>([QUERY_KEYS.TALENT_PROFILE]);
    if (!existingProfile) {
      throw new Error("既存のプロフィールデータが見つかりません");
    }

    // APIリクエストを実行
    const response = await apiRequest("PATCH", QUERY_KEYS.TALENT_PROFILE, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "プロフィールの更新に失敗しました");
    }

    const updatedProfile = await response.json() as TalentProfileData;

    // 編集不可フィールドの保護
    const protectedFields = ['birthDate', 'createdAt', 'id', 'userId'] as const;
    const mergedProfile = {
      ...existingProfile,
      ...updatedProfile,
      ...protectedFields.reduce((acc, field) => ({
        ...acc,
        [field]: existingProfile[field]
      }), {})
    };

    console.log("Profile merge result:", {
      timestamp: new Date().toISOString(),
      existingFields: Object.keys(existingProfile),
      updatedFields: Object.keys(updatedProfile),
      mergedFields: Object.keys(mergedProfile)
    });

    // キャッシュの更新
    queryClient.setQueryData<TalentProfileData>([QUERY_KEYS.TALENT_PROFILE], mergedProfile);

    // ローカルストレージの更新
    localStorage.setItem('talentProfile', JSON.stringify(mergedProfile));

    // キャッシュを無効化して強制的に再取得
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });

    // 即時に再フェッチを実行
    await queryClient.refetchQueries({ 
      queryKey: [QUERY_KEYS.TALENT_PROFILE],
      exact: true
    });

    return mergedProfile;
  } catch (error) {
    console.error("Profile update failed:", {
      error,
      timestamp: new Date().toISOString()
    });

    // エラー時にキャッシュを無効化
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
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