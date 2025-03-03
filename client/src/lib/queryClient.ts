import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

  console.log(`API Request: ${method} ${url}`, {
    headers: { ...headers, Authorization: token ? "Bearer [HIDDEN]" : undefined },
    data: data ? JSON.stringify(data) : undefined
  });

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    console.error(`API Error: ${method} ${url}`, {
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

    console.log(`Query Request: GET ${queryKey[0]}`, {
      headers: { ...headers, Authorization: token ? "Bearer [HIDDEN]" : undefined }
    });

    const res = await fetch(queryKey[0] as string, {
      headers,
    });

    if (!res.ok) {
      console.error(`Query Error: GET ${queryKey[0]}`, {
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