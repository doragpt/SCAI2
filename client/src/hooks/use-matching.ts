import { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";

export interface MatchingConditions {
  workTypes: string[];
  workPeriodStart: string;
  workPeriodEnd: string;
  canArrivePreviousDay: boolean;
  desiredGuarantee: string;
  desiredTime: string;
  desiredRate: string;
  waitingHours?: number;
  departureLocation: string;
  returnLocation: string;
  preferredLocations: string[];
  ngLocations: string[];
  notes: string;
  interviewDates: string[];
}

export interface MatchedJob {
  id: number;
  businessName: string;
  location: string;
  serviceType: string;
  minimumGuarantee: number;
  maximumGuarantee: number;
  transportationSupport: boolean;
  housingSupport: boolean;
  workingHours: string;
  description: string;
  requirements: string;
  benefits: string;
  matchScore: number;
  matches: string[];
}

// startMatching関数を個別にエクスポート
export async function startMatching(conditions: MatchingConditions): Promise<MatchedJob[]> {
  try {
    // API呼び出し先をAIマッチングエンドポイントに変更
    // クエリパラメータを構築
    const queryParams = new URLSearchParams();
    
    // 条件があれば追加
    if (conditions.preferredLocations.length > 0) {
      queryParams.append('location', conditions.preferredLocations[0]);
    }
    
    if (conditions.workTypes.length > 0) {
      queryParams.append('serviceType', conditions.workTypes[0]);
    }
    
    // 最低希望保証額がある場合
    if (conditions.desiredGuarantee) {
      // 数値のみを抽出
      const guaranteeValue = conditions.desiredGuarantee.replace(/[^0-9]/g, '');
      if (guaranteeValue) {
        queryParams.append('minGuarantee', guaranteeValue);
      }
    }
    
    const url = `/api/talent/ai-matching${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('AI Matching API URL:', url);
    
    const response = await apiRequest("GET", url);
    
    if (!response.ok) {
      throw new Error(`マッチング検索エラー: ${response.status} ${response.statusText}`);
    }
    
    // APIレスポンスをJSON化
    const data = await response.json();
    
    // AIマッチングレスポンスの形式に合わせて変換
    if (data && Array.isArray(data.matches)) {
      return data.matches;
    } else {
      console.warn('Unexpected API response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error in startMatching:', error);
    throw error;
  }
}

export function useMatching() {
  const [matchingResults, setMatchingResults] = useState<MatchedJob[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartMatching = async (conditions: MatchingConditions) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await startMatching(conditions);
      setMatchingResults(response);
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : "マッチング処理に失敗しました");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    matchingResults,
    setMatchingResults,
    currentPage,
    setCurrentPage,
    startMatching: handleStartMatching,
    isLoading,
    error,
  };
}