import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";

export async function getTalentProfile(): Promise<TalentProfileData | null> {
  try {
    console.log('[Talent API] Fetching profile, starting request');

    // APIリクエストを実行
    const response = await apiRequest("GET", "/api/talent/profile");

    console.log('[Talent API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString()
    });

    // 404の場合は新規ユーザーとして扱い、nullを返す
    if (response.status === 404) {
      console.log('[Talent API] New user detected (404 response)');
      return null;
    }

    // エラーレスポンスの処理
    if (!response.ok) {
      let errorMessage = "プロフィールの取得に失敗しました";
      let responseText;

      try {
        responseText = await response.text();
        console.log('[Talent API] Error response text:', responseText);

        if (responseText) {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        }
      } catch (parseError) {
        console.error('[Talent API] Error parsing response:', {
          parseError,
          responseText,
          status: response.status,
          statusText: response.statusText
        });
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    // 正常なレスポンスの処理
    const data = await response.json();
    console.log('[Talent API] Profile data received successfully');
    return data;

  } catch (error) {
    console.error('[Talent API] Fetch error:', {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function createOrUpdateTalentProfile(data: TalentProfileData): Promise<void> {
  try {
    console.log('[Talent API] Starting profile update');

    const response = await apiRequest("POST", "/api/talent/profile", data);

    console.log('[Talent API] Update response received:', {
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      let errorMessage = "プロフィールの保存に失敗しました";
      let responseText;

      try {
        responseText = await response.text();
        console.log('[Talent API] Error response text:', responseText);

        if (responseText) {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        }
      } catch (parseError) {
        console.error('[Talent API] Error parsing response:', {
          parseError,
          responseText,
          status: response.status,
          statusText: response.statusText
        });
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    console.log('[Talent API] Profile updated successfully');
  } catch (error) {
    console.error('[Talent API] Update error:', {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export function invalidateTalentProfileCache(queryClient: any) {
  return queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TALENT_PROFILE] });
}