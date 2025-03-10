import { apiRequest } from "@/lib/queryClient";
import type { TalentProfileData } from "@shared/schema";
import { QUERY_KEYS } from "@/constants/queryKeys";

// このファイルは非推奨となります。
// すべての関数は @/lib/queryClient.ts に移動されました。
// 互換性のために一時的にエクスポートを維持します。
export {
  createOrUpdateTalentProfile,
  getTalentProfile,
  invalidateTalentProfileCache
} from "@/lib/queryClient";