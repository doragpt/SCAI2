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
  catchPhrase?: string;
  minimumGuarantee: number | null;
  maximumGuarantee: number | null;
  transportationSupport: boolean;
  housingSupport: boolean;
  workingHours?: string;
  description?: string;
  benefits?: string[] | null;
  matchScore: number;
  matches: string[];
}

// startMatching関数を個別にエクスポート
export async function startMatching(conditions: MatchingConditions): Promise<MatchedJob[]> {
  try {
    // API呼び出し先をAIマッチングエンドポイントに変更
    // クエリパラメータを構築
    const queryParams = new URLSearchParams();
    
    // 希望エリアの追加（複数の場合は全て追加）
    if (conditions.preferredLocations.length > 0) {
      conditions.preferredLocations.forEach(location => {
        queryParams.append('location', location);
      });
    }
    
    // 現在地も希望エリアとして追加
    if (conditions.departureLocation) {
      queryParams.append('location', conditions.departureLocation);
    }
    
    // 希望業種の追加（複数の場合は全て追加）
    if (conditions.workTypes.length > 0) {
      conditions.workTypes.forEach(type => {
        queryParams.append('serviceType', type);
      });
    }
    
    // 最低希望保証額がある場合
    if (conditions.desiredGuarantee) {
      // 数値のみを抽出
      const guaranteeValue = conditions.desiredGuarantee.replace(/[^0-9]/g, '');
      if (guaranteeValue) {
        queryParams.append('minGuarantee', guaranteeValue);
      }
    }
    
    // フィルタリング条件
    // 特定のエリアに限定する場合
    if (conditions.preferredLocations.length === 1) {
      queryParams.append('filterByLocation', conditions.preferredLocations[0]);
    }
    
    // 特定の業種に限定する場合
    if (conditions.workTypes.length === 1) {
      queryParams.append('filterByService', conditions.workTypes[0]);
    }
    
    // 待機時間が指定されている場合（スケジュール情報）
    if (conditions.waitingHours) {
      queryParams.append('waitingHours', conditions.waitingHours.toString());
    }
    
    // 特定項目の重み付け変更
    if (conditions.preferredLocations.length > 0) {
      queryParams.append('prioritizeLocation', 'true');
    }
    
    if (conditions.desiredGuarantee) {
      queryParams.append('prioritizeGuarantee', 'true');
    }
    
    // 結果数の制限
    queryParams.append('limit', '20'); // 最大20件に制限
    
    // 出稼ぎの場合は、出発地と帰宅地の両方を希望エリアに追加
    if (conditions.workTypes.includes('出稼ぎ')) {
      if (conditions.departureLocation) {
        queryParams.append('location', conditions.departureLocation);
      }
      if (conditions.returnLocation && conditions.returnLocation !== conditions.departureLocation) {
        queryParams.append('location', conditions.returnLocation);
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
      // マッチスコアでソートして返却
      return data.matches.sort((a: MatchedJob, b: MatchedJob) => b.matchScore - a.matchScore);
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