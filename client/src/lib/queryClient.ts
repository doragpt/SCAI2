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
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<T> {
  try {
    log('info', 'APIリクエスト開始', {
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
      credentials: "include", // セッションCookieを送信
    });

    // レスポンスのJSON解析
    const responseData = await response.json().catch(e => {
      log('error', 'JSONパース失敗', {
        error: e instanceof Error ? e.message : 'Unknown error',
        status: response.status,
        url: fullUrl
      });
      return { success: false, message: "レスポンスの解析に失敗しました" };
    });
    
    if (!response.ok) {
      log('error', 'APIリクエストエラー', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        responseData
      });

      throw new Error(responseData.message || "APIリクエストに失敗しました");
    }

    console.log(`API Response from ${url}:`, responseData);
    
    // サーバー側でsuccess: falseで返ってきた場合もエラーとして処理
    if (responseData && responseData.success === false) {
      log('error', 'APIリクエストはHTTP 200だがレスポンスに失敗', {
        url: fullUrl,
        responseData
      });
      throw new Error(responseData.message || "処理は完了しましたが、エラーが発生しました");
    }
    
    return responseData as T;
  } catch (error) {
    log('error', 'APIリクエストエラー', {
      method,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Note: タレントプロフィール関連の関数は lib/api/talent.ts に移動しました
// このモジュールは apiRequest 関数のみをエクスポートします

// 求人一覧取得用のクエリ関数
export const getJobsQuery = async (): Promise<any[]> => {
  try {
    console.log('Fetching jobs data...');
    return await apiRequest<any[]>("GET", QUERY_KEYS.JOBS_PUBLIC);
  } catch (error) {
    console.error('求人情報取得エラー:', error);
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
  jobs: any[];
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

    const url = `${QUERY_KEYS.JOBS_SEARCH}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    console.log('Fetching jobs:', { url, params });

    const data = await apiRequest<any[]>("GET", url);

    // レスポンスをページネーション形式に整形
    return {
      jobs: data,
      pagination: {
        currentPage: params.page || 1,
        totalPages: Math.ceil(data.length / (params.limit || 12)),
        totalItems: data.length
      }
    };
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
  return await apiRequest<any>("PATCH", "/auth/user", data);
}

// AIマッチング関連の型定義
export interface MatchedJob {
  id: number;
  businessName: string;
  location: string;
  serviceType: string;
  catchPhrase: string;
  description: string;
  minimumGuarantee: number | null;
  maximumGuarantee: number | null;
  transportationSupport: boolean;
  housingSupport: boolean;
  benefits: string[];
  matchScore: number;
  matches: string[];
}

export interface MatchingResult {
  matches: MatchedJob[];
  totalMatches: number;
  error?: string;
}

// AIマッチング検索リクエスト
export async function getAIMatching(options?: Record<string, any>): Promise<MatchingResult> {
  try {
    log('info', 'AIマッチング開始', {
      options,
      timestamp: new Date().toISOString()
    });

    // オプションがあれば、クエリパラメータに変換
    let url = '/api/talent/ai-matching';
    if (options) {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const result = await apiRequest<MatchingResult>("GET", url);
    
    log('info', 'AIマッチング成功', {
      totalMatches: result.totalMatches || 0,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    log('error', 'AIマッチングエラー', {
      options,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// クエリクライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

// 写真アップロード用の関数
export async function uploadPhoto(base64Data: string, fileName: string): Promise<{url: string, fileName: string}> {
  try {
    log('info', '写真アップロード開始', {
      fileName,
      timestamp: new Date().toISOString()
    });

    const result = await apiRequest<{url: string, fileName: string, message: string}>(
      "POST",
      "/api/upload/photo",
      { base64Data, fileName }
    );
    
    // 明示的にレスポンスを検証
    if (!result || !result.url) {
      const errorMsg = '写真アップロード失敗: URLが取得できません';
      log('error', errorMsg, { fileName });
      throw new Error(`${errorMsg} (ファイル: ${fileName})`);
    }
    
    log('info', '写真アップロード成功', {
      fileName,
      uploadedFileName: result.fileName,
      timestamp: new Date().toISOString()
    });

    return { 
      url: result.url, 
      fileName: result.fileName || fileName 
    };
  } catch (error) {
    log('error', '写真アップロードエラー', {
      fileName,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// 署名付きURLを取得する関数
export async function getSignedPhotoUrl(key: string): Promise<string> {
  try {
    log('info', '署名付きURL取得開始', {
      key,
      timestamp: new Date().toISOString()
    });

    const result = await apiRequest<{url: string}>(
      "GET",
      `/api/upload/signed-url/${key}`
    );
    
    log('info', '署名付きURL取得成功', {
      key,
      timestamp: new Date().toISOString()
    });

    return result.url;
  } catch (error) {
    log('error', '署名付きURL取得エラー', {
      key,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// デバッグ用のログ関数
function log(level: 'info' | 'error', message: string, data?: any) {
  const logData = {
    level,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(logData));
}

export { QUERY_KEYS };