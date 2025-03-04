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

// Query Function の定義（先に移動）
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
            userId: (profileData as TalentProfileData).userId
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
      if (url === QUERY_KEYS.TALENT_PROFILE) {
        localStorage.setItem('talentProfile', JSON.stringify(data));
        console.log("Updated cached profile data:", {
          timestamp: new Date().toISOString(),
          userId: (data as TalentProfileData).userId
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
  data?: unknown | undefined,
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
    console.log("Updating profile with data:", {
      timestamp: new Date().toISOString(),
      userId: data.userId
    });

    // 既存のデータを取得
    const existingProfile = queryClient.getQueryData<TalentProfileData>([QUERY_KEYS.TALENT_PROFILE]);

    // APIリクエストを実行
    const response = await apiRequest("PUT", QUERY_KEYS.TALENT_PROFILE, data);
    const updatedProfile = await response.json() as TalentProfileData;

    console.log("Profile update successful:", {
      timestamp: new Date().toISOString(),
      userId: updatedProfile.userId
    });

    // 既存のデータと新しいデータをマージ
    const mergedProfile = {
      ...existingProfile,
      ...updatedProfile,
      // 編集不可フィールドは必ず既存の値を維持
      birthDate: updatedProfile.birthDate || existingProfile?.birthDate,
      createdAt: existingProfile?.createdAt,
      id: existingProfile?.id,
      userId: existingProfile?.userId,
    };

    // データの整合性チェック
    if (!mergedProfile.birthDate && existingProfile?.birthDate) {
      console.warn("birthDate field was lost during update, restoring from existing data");
      mergedProfile.birthDate = existingProfile.birthDate;
    }

    // キャッシュの更新処理
    queryClient.setQueryData<TalentProfileData>([QUERY_KEYS.TALENT_PROFILE], mergedProfile);

    // ローカルストレージに保存
    localStorage.setItem('talentProfile', JSON.stringify(mergedProfile));

    // キャッシュを無効化して再取得を強制
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
    await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE], exact: true });

    return mergedProfile;
  } catch (error) {
    console.error("Profile update failed:", {
      error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// React Query クライアントの設定（後ろに移動）
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // キャッシュを常に無効化
      refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
      refetchOnMount: true, // コンポーネントマウント時に再取得
      refetchOnReconnect: true, // 再接続時に再取得
      retry: 2, // エラー時のリトライ回数を2回に設定
      queryFn: getQueryFn({ on401: "throw" }),
    },
    mutations: {
      retry: 1,
    },
  },
});