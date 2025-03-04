import { prefectures } from "@/constants/work-types";

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

export function formatConditionsMessage(
  conditions: MatchingConditions,
  type: "出稼ぎ" | "在籍" | null
): string {
  if (!type) return "";

  const messages: string[] = [];

  // 共通の条件
  if (conditions.workTypes.length > 0) {
    messages.push(`【希望業種】\n${conditions.workTypes.join("、")}`);
  }

  if (type === "出稼ぎ") {
    // 出稼ぎ特有の条件
    if (conditions.workPeriodStart && conditions.workPeriodEnd) {
      messages.push(
        `【勤務期間】\n${conditions.workPeriodStart} ～ ${conditions.workPeriodEnd}`
      );
    }

    if (conditions.canArrivePreviousDay) {
      messages.push("【前日入り】\n可能");
    }

    if (conditions.desiredGuarantee) {
      const amount = conditions.desiredGuarantee === 'none' 
        ? '希望なし'
        : `${parseInt(conditions.desiredGuarantee).toLocaleString()}円`;
      messages.push(`【希望保証】\n${amount}`);
    }

    if (conditions.desiredTime && conditions.desiredRate) {
      const time = `${conditions.desiredTime}分`;
      const rate = `${parseInt(conditions.desiredRate).toLocaleString()}円`;
      messages.push(`【希望単価】\n${time} ${rate}`);
    }

    if (conditions.waitingHours) {
      messages.push(`【待機時間】\n${conditions.waitingHours}時間`);
    }

    if (conditions.departureLocation) {
      messages.push(`【出発地】\n${conditions.departureLocation}`);
    }

    if (conditions.returnLocation) {
      messages.push(`【帰宅地】\n${conditions.returnLocation}`);
    }

  } else {
    // 在籍の場合
    if (conditions.interviewDates.length > 0) {
      messages.push(
        `【面接希望日時】\n${conditions.interviewDates
          .filter(date => date)
          .map((date, i) => `${i + 1}. ${date}`)
          .join("\n")}`
      );
    }
  }

  // 共通の追加条件
  if (conditions.preferredLocations.length > 0) {
    messages.push(`【希望地域】\n${conditions.preferredLocations.join("、")}`);
  }

  if (conditions.ngLocations.length > 0) {
    messages.push(`【NG地域】\n${conditions.ngLocations.join("、")}`);
  }

  if (conditions.notes) {
    messages.push(`【備考】\n${conditions.notes}`);
  }

  return messages.join("\n\n");
}
