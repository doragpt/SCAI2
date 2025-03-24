import { StoreProfile } from "@shared/schema";
import { JobFormTabs } from "./job-form-tabs";

type JobFormProps = {
  initialData?: StoreProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/**
 * 店舗情報入力フォーム
 * JobFormTabsコンポーネントをラップし、タブUIに対応したフォームを表示します
 */
export function JobForm({ initialData, onSuccess, onCancel }: JobFormProps) {
  // 新しいJobFormTabsコンポーネントにpropsを渡す
  return (
    <JobFormTabs 
      initialData={initialData} 
      onSuccess={onSuccess} 
      onCancel={onCancel} 
    />
  );
}