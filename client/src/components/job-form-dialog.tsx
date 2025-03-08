import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobForm } from "./job-form";

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: number;
  initialData?: any;
};

export function JobFormDialog({
  open,
  onOpenChange,
  jobId,
  initialData
}: JobFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {jobId ? "求人情報を編集" : "新規求人を作成"}
          </DialogTitle>
          <DialogDescription>
            必要な情報を入力して求人情報を{jobId ? "更新" : "作成"}してください。
          </DialogDescription>
        </DialogHeader>
        <JobForm
          jobId={jobId}
          initialData={initialData}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
