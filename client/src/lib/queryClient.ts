import { QueryClient, QueryFunction } from "@tanstack/react-query";
import type { TalentProfileData, SelectUser, Photo } from "@shared/schema";

// キャッシュのキー定数
export const QUERY_KEYS = {
  TALENT_PROFILE: "/api/talent/profile",
  USER: "/api/user",
  USER_PROFILE: "/api/user/profile",
  JOBS: "/api/jobs/public",
  SIGNED_URL: "/api/get-signed-url"
} as const;

type UnauthorizedBehavior = "returnNull" | "throw";

// APIのベースURL設定
const API_BASE_URL = (() => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
})();

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

    // PUT /api/talent/profile の特別処理
    if (method === "PUT" && url === "/api/talent/profile" && data) {
      const profileData = data as TalentProfileData;

      if (profileData.photos?.some(photo => photo.url.startsWith('data:'))) {
        console.log('Photos detected in request, handling separately');

        const photosToUpload = profileData.photos.filter(photo => photo.url.startsWith('data:'));
        const existingPhotos = profileData.photos.filter(photo => !photo.url.startsWith('data:'));

        // 写真に一意のIDと順序を付与
        const markedPhotos = photosToUpload.map((photo, index) => ({
          ...photo,
          id: photo.id || `${Date.now()}-${index}`,
          order: typeof photo.order === 'number' ? photo.order : existingPhotos.length + index
        }));

        const uploadedPhotos: Photo[] = [];

        // 順番に写真をアップロード
        for (const photo of markedPhotos) {
          const uploadedPhoto = await uploadPhoto(photo, headers);
          if (uploadedPhoto) {
            uploadedPhotos.push(uploadedPhoto);
          }
        }

        // 既存の写真と新しくアップロードされた写真を結合し、順序で並び替え
        profileData.photos = [...existingPhotos, ...uploadedPhotos]
          .sort((a, b) => (typeof a.order === 'number' ? a.order : 0) - (typeof b.order === 'number' ? b.order : 0));

        console.log('Final photos array:', {
          totalPhotos: profileData.photos.length,
          existingPhotos: existingPhotos.length,
          uploadedPhotos: uploadedPhotos.length,
          photoIds: profileData.photos.map(p => p.id),
          timestamp: new Date().toISOString()
        });
      }
    }

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
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
      error: error instanceof Error ? error.message : "Unknown error",
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

// プリサインドURL取得関数を追加
export async function getSignedImageUrl(key: string): Promise<string> {
  try {
    console.log('Requesting signed URL:', {
      key,
      timestamp: new Date().toISOString()
    });

    const response = await apiRequest(
      "GET",
      `${QUERY_KEYS.SIGNED_URL}?key=${encodeURIComponent(key)}`
    );
    const data = await response.json();

    return data.url;
  } catch (error) {
    console.error('Failed to get signed URL:', {
      error,
      key,
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