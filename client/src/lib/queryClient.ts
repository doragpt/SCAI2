import { QueryClient, QueryFunction } from "@tanstack/react-query";

// APIのベースURL設定の改善
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  // Replitの開発環境に合わせて設定を調整
  return process.env.NODE_ENV === "development"
    ? `${protocol}//${hostname}`  // ポート指定を削除
    : "";
})();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    console.error("Detailed API Error:", {
      status: res.status,
      statusText: res.statusText,
      data,
      url: res.url,
      type: res.type,
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

  console.log("Detailed API Request:", {
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
      mode: "same-origin", // CORSモードを調整
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("Detailed API Request Failed:", {
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

export const getQueryFn: <T>(options: {
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
      const res = await fetch(fullUrl, {
        headers,
        credentials: "include",
        mode: "same-origin", // CORSモードを調整
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Detailed Query Failed:", {
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});