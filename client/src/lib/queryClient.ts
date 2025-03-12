import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = process.env.NODE_ENV === 'development' ? ':3000' : '';
  return `${protocol}//${hostname}${port}`;
})();

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

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // CORSリクエストでクッキーを送信
    });

    console.log('API Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      timestamp: new Date().toISOString()
    });

    // レスポンスヘッダーのログ出力
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('Response headers:', responseHeaders);

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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

export { QUERY_KEYS };