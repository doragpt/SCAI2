import { QueryClient, QueryFunction } from "@tanstack/react-query";

// APIのベースURL設定
const API_BASE_URL = process.env.NODE_ENV === "development" 
  ? "http://localhost:5000"
  : "";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(data.message || res.statusText);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};

  // データがある場合はContent-Typeを設定
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // トークンがある場合はAuthorizationヘッダーを追加
  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  console.log(`API Request: ${method} ${fullUrl}`, {
    headers: { ...headers, Authorization: token ? "Bearer [HIDDEN]" : undefined },
    data: data ? JSON.stringify(data) : undefined
  });

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    console.error(`API Error: ${method} ${fullUrl}`, {
      status: res.status,
      statusText: res.statusText,
      data: await res.json().catch(() => null)
    });
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    // トークンがある場合はAuthorizationヘッダーを追加
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = queryKey[0] as string;
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    console.log(`Query Request: GET ${fullUrl}`, {
      headers: { ...headers, Authorization: token ? "Bearer [HIDDEN]" : undefined }
    });

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      console.error(`Query Error: GET ${fullUrl}`, {
        status: res.status,
        statusText: res.statusText,
        data: await res.json().catch(() => null)
      });
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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