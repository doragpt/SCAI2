import { useState } from 'react';
import { Store } from '@shared/types/store';

interface MatchingConditions {
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

export function useMatching() {
  const [matchingResults, setMatchingResults] = useState<Store[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const startMatching = async (conditions: MatchingConditions) => {
    try {
      // 実際の実装では、APIを呼び出してマッチング処理を行う
      // ここではモックデータを返す
      const mockResults = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `店舗${i + 1}`,
        location: '東京都',
        rating: Math.random(),
        matches: ['希望時給', '勤務時間帯', '業態'],
        checked: false
      }));

      setMatchingResults(mockResults);
      return mockResults;
    } catch (error) {
      console.error('Error in startMatching:', error);
      throw error;
    }
  };

  return {
    matchingResults,
    setMatchingResults,
    currentPage,
    setCurrentPage,
    startMatching,
  };
}