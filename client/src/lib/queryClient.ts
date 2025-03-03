import { QueryClient, QueryFunction } from "@tanstack/react-query";

// キャッシュのキー定数
export const QUERY_KEYS = {
  TALENT_PROFILE: "/api/talent/profile",
} as const;

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

  console.log("API Request:", {
    method,
    url: fullUrl,
    headers: { ...headers, Authorization: token ? "[HIDDEN]" : undefined },
    data: data ? "[HIDDEN]" : undefined,
    timestamp: new Date().toISOString()
  });

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
export async function updateTalentProfile(data: any) {
  try {
    // APIリクエストを実行
    const response = await apiRequest("PUT", QUERY_KEYS.TALENT_PROFILE, data);
    const updatedProfile = await response.json();

    // キャッシュの更新処理
    queryClient.setQueryData([QUERY_KEYS.TALENT_PROFILE], updatedProfile);

    // 強制的に再取得を実行
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
    await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE], exact: true });

    // ローカルストレージにも保存
    localStorage.setItem('cachedProfile', JSON.stringify(updatedProfile));

    return updatedProfile;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
}

export const getQueryFn: <T>({
  on401,
}: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
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
        // キャッシュされたデータを確認
        const cachedData = localStorage.getItem('cachedProfile');
        if (cachedData && url === QUERY_KEYS.TALENT_PROFILE) {
          return JSON.parse(cachedData);
        }

        const res = await fetch(fullUrl, {
          headers,
          credentials: "include",
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        const data = await res.json();

        // プロフィールデータの場合はローカルストレージに保存
        if (url === QUERY_KEYS.TALENT_PROFILE) {
          localStorage.setItem('cachedProfile', JSON.stringify(data));
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

type UnauthorizedBehavior = "returnNull" | "throw";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // キャッシュを常に無効化
      cacheTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
      refetchOnMount: true, // コンポーネントマウント時に再取得
      refetchOnReconnect: true, // 再接続時に再取得
      retry: 1,
      queryFn: getQueryFn({ on401: "throw" }),
    },
    mutations: {
      retry: 1,
    },
  },
});