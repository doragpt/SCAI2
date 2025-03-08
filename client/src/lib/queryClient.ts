import { QueryClient } from "@tanstack/react-query";
import type { TalentProfileData, SelectUser, Photo, JobsSearchResponse, Job } from "@shared/schema";
import { getErrorMessage } from "@/lib/utils";
import { QUERY_KEYS } from "@/constants/queryKeys";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

// APIリクエスト関数を改善
export async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  try {
    console.log('API Request starting:', {
      method,
      url,
      hasData: !!data,
      timestamp: new Date().toISOString()
    });

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log('Adding auth token to request');
    }

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log('API Response received:', {
      status: res.status,
      statusText: res.statusText,
      timestamp: new Date().toISOString()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      console.error('API Request Failed:', {
        status: res.status,
        statusText: res.statusText,
        responseText: JSON.stringify(errorData),
        timestamp: new Date().toISOString()
      });

      // 認証エラーの場合、トークンを削除
      if (res.status === 401) {
        console.log('Unauthorized request, removing token');
        localStorage.removeItem("auth_token");
      }

      throw new Error(errorData.message || res.statusText);
    }

    const responseData = await res.json() as T;
    return responseData;
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

// 写真アップロード処理を修正
async function uploadPhoto(photo: Photo, headers: Record<string, string>): Promise<Photo | null> {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Base64データを分割してアップロード（チャンクサイズを16KBに縮小）
      const chunkSize = 16 * 1024;
      const [header, base64Data] = photo.url.split(',');
      const totalChunks = Math.ceil(base64Data.length / chunkSize);
      const photoId = photo.id || `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      console.log('Starting chunked upload:', {
        photoId,
        tag: photo.tag,
        totalChunks,
        totalSize: base64Data.length,
        chunkSize,
        timestamp: new Date().toISOString()
      });

      // 写真のチャンクを順番にアップロード
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, base64Data.length);
        const chunk = base64Data.slice(start, end);

        console.log(`Uploading chunk ${i + 1}/${totalChunks}`, {
          chunkSize: chunk.length,
          timestamp: new Date().toISOString()
        });

        let chunkRetries = 0;
        const maxChunkRetries = 3;
        let lastError = null;

        while (chunkRetries < maxChunkRetries) {
          try {
            const chunkRes = await fetch(`${API_BASE_URL}/api/upload-photo-chunk`, {
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                photo: `${header},${chunk}`,
                totalChunks,
                chunkIndex: i,
                photoId,
                tag: photo.tag,
                order: photo.order
              }),
            });

            if (!chunkRes.ok) {
              const errorData = await chunkRes.json().catch(() => ({ message: chunkRes.statusText }));
              throw new Error(errorData.message || `Failed to upload photo chunk: ${chunkRes.statusText}`);
            }

            const result = await chunkRes.json();
            console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully`);

            if (result.url) {
              return {
                id: photoId,
                url: result.url,
                tag: photo.tag,
                order: photo.order
              };
            }
            break;
          } catch (chunkError) {
            lastError = chunkError;
            chunkRetries++;
            if (chunkRetries === maxChunkRetries) {
              throw new Error(`Failed to upload chunk after ${maxChunkRetries} attempts: ${lastError?.message || 'Unknown error'}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, chunkRetries)));
          }
        }

        // チャンク間の待機時間を最適化（600ms）
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
    } catch (error) {
      console.error('Photo upload attempt failed:', {
        attempt: retryCount + 1,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });

      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error(`Failed to upload photo after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
    }
  }
  return null;
}


// 求人一覧取得用のクエリ関数
export const getJobsQuery = async (): Promise<Job[]> => {
  try {
    console.log('Fetching public jobs:', {
      endpoint: QUERY_KEYS.JOBS_PUBLIC,
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest<Job[]>("GET", QUERY_KEYS.JOBS_PUBLIC);

    if (!Array.isArray(response)) {
      console.error('Invalid jobs response format:', {
        response,
        timestamp: new Date().toISOString()
      });
      return [];
    }

    console.log('Jobs fetched successfully:', {
      count: response.length,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error("Jobs fetch error:", {
      error: getErrorMessage(error),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 求人検索用のクエリ関数
export const searchJobsQuery = async (params: {
  location?: string;
  serviceType?: string;
  page?: number;
  limit?: number;
}): Promise<JobsSearchResponse> => {
  try {
    const searchParams = new URLSearchParams();
    if (params.location) searchParams.set("location", params.location);
    if (params.serviceType) searchParams.set("serviceType", params.serviceType);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const url = `${QUERY_KEYS.JOBS_SEARCH}?${searchParams.toString()}`;
    return await apiRequest<JobsSearchResponse>("GET", url);
  } catch (error) {
    console.error("Jobs search error:", {
      error: getErrorMessage(error),
      params,
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

    // APIリクエストを実行
    const response = await apiRequest<TalentProfileData>("PATCH", QUERY_KEYS.TALENT_PROFILE, data);
    const updatedProfile = response;

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
      error: getErrorMessage(error),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// ユーザー情報更新用の関数
export async function updateUserProfile(data: {
  displayName?: string;
  location?: string;
  preferredLocations?: string[];
  username?: string;
}): Promise<SelectUser> {
  try {
    console.log("Starting user profile update:", {
      timestamp: new Date().toISOString(),
      updateData: data
    });

    // 既存のデータを取得
    const existingUser = queryClient.getQueryData<SelectUser>([QUERY_KEYS.USER]);
    if (!existingUser) {
      console.warn("No existing user data in cache");
    }

    const response = await apiRequest<SelectUser>("PATCH", QUERY_KEYS.USER, data);
    const updatedUser = response;

    // 型安全なマージ処理
    const mergedUser: SelectUser = {
      ...(existingUser || {}),
      ...updatedUser,
    } as SelectUser;

    console.log("User update cache merge:", {
      timestamp: new Date().toISOString(),
      existingFields: existingUser ? Object.keys(existingUser) : [],
      updatedFields: Object.keys(updatedUser),
      mergedFields: Object.keys(mergedUser)
    });

    // キャッシュの更新
    queryClient.setQueryData<SelectUser>([QUERY_KEYS.USER], mergedUser);

    // キャッシュを無効化して再取得
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    await queryClient.refetchQueries({
      queryKey: [QUERY_KEYS.USER],
      exact: true
    });

    return mergedUser;
  } catch (error) {
    console.error("User profile update failed:", {
      error: getErrorMessage(error),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}


// プリサインドURL取得関数を追加
export async function getSignedImageUrl(key: string): Promise<string> {
  try {
    console.log('Requesting signed URL:', {
      key,
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest<{ url: string }>(
      "GET",
      `${QUERY_KEYS.SIGNED_URL}?key=${encodeURIComponent(key)}`
    );
    const data = response;

    return data.url;
  } catch (error) {
    console.error('Failed to get signed URL:', {
      error: getErrorMessage(error),
      key,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// クエリクライアントの設定を改善
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
      retry: (failureCount, error) => {
        // 認証エラーの場合はリトライしない
        if (error instanceof Error && error.message.includes("401")) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

export { QUERY_KEYS };