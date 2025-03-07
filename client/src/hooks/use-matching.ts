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
    const response = await apiRequest<MatchedJob[]>(
      "POST",
      "/api/talent/matching",
      conditions
    );
    return response;
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