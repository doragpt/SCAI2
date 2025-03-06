import { QueryClient, QueryFunction } from "@tanstack/react-query";
import type { TalentProfileData, SelectUser } from "@shared/schema";

// キャッシュのキー定数
export const QUERY_KEYS = {
  TALENT_PROFILE: "/api/talent/profile",
  USER: "/api/user",
  USER_PROFILE: "/api/user/profile",
  JOBS: "/api/jobs/public"
} as const;

type UnauthorizedBehavior = "returnNull" | "throw";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

// APIリクエスト用の基本関数を修正
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
    console.log('API Request starting:', {
      method,
      url,
      dataSize: data ? JSON.stringify(data).length : 0,
      timestamp: new Date().toISOString()
    });

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    // 写真データを含むプロフィール更新の場合は、先に写真をS3にアップロード
    if (method === "PUT" && url === "/api/talent/profile" && data) {
      const profileData = data as TalentProfileData;
      if (profileData.photos?.some(photo => photo.url.startsWith('data:'))) {
        console.log('Photos detected in request, handling separately');

        // S3アップロード用のエンドポイントを順次呼び出し
        const photosToUpload = profileData.photos.filter(photo => photo.url.startsWith('data:'));
        const uploadedPhotos = [];

        for (const photo of photosToUpload) {
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              console.log(`Uploading photo (attempt ${retryCount + 1}/${maxRetries})`);

              // Base64データを分割してアップロード
              const chunkSize = 30 * 1024; // 30KB chunks
              const base64Data = photo.url.split(',')[1];
              const totalChunks = Math.ceil(base64Data.length / chunkSize);
              const photoId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

              console.log('Starting chunked upload:', {
                totalChunks,
                totalSize: base64Data.length,
                chunkSize,
                timestamp: new Date().toISOString()
              });

              for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = start + chunkSize;
                const chunk = base64Data.slice(start, end);

                console.log(`Uploading chunk ${i + 1}/${totalChunks}`, {
                  chunkSize: chunk.length,
                  timestamp: new Date().toISOString()
                });

                try {
                  const chunkRes = await fetch(`${API_BASE_URL}/api/upload-photo-chunk`, {
                    method: 'POST',
                    headers: {
                      ...headers,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      photo: `data:image/jpeg;base64,${chunk}`,
                      totalChunks,
                      chunkIndex: i,
                      photoId,
                    }),
                  });

                  if (!chunkRes.ok) {
                    throw new Error(`Failed to upload photo chunk: ${chunkRes.statusText}`);
                  }

                  const result = await chunkRes.json();
                  console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully`);

                  if (i === totalChunks - 1 && result.url) {
                    uploadedPhotos.push({ ...photo, url: result.url });
                  }
                } catch (chunkError) {
                  console.error(`Chunk upload error (${i + 1}/${totalChunks}):`, {
                    error: chunkError instanceof Error ? chunkError.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                  });
                  throw chunkError;
                }

                // チャンク間で少し待機して負荷を分散
                if (i < totalChunks - 1) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }

              console.log('Photo upload successful');
              break;
            } catch (error) {
              console.error('Photo upload attempt failed:', {
                attempt: retryCount + 1,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
              });

              retryCount++;
              if (retryCount === maxRetries) {
                throw new Error(`Failed to upload photo after ${maxRetries} attempts`);
              }

              // 失敗した場合は少し待ってからリトライ（指数関数的バックオフ）
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
            }
          }
        }

        // 既存のURLと新しいURLを組み合わせる
        profileData.photos = profileData.photos.map(photo => {
          if (photo.url.startsWith('data:')) {
            const uploaded = uploadedPhotos.find(up => up.tag === photo.tag);
            return uploaded || photo;
          }
          return photo;
        });

        // 更新されたデータで本来のリクエストを実行
        data = profileData;
      }
    }

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

    // APIリクエストを実行
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

    const response = await apiRequest("PATCH", QUERY_KEYS.USER, data);
    const updatedUser = await response.json() as SelectUser;

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