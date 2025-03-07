```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCreationForm } from "@/components/job-creation-form";
import { RecruitmentCriteriaForm } from "@/components/recruitment-criteria-form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { InsertJob, InsertRecruitmentCriteria } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Check, Store } from "lucide-react";

export function JobPostingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<"job" | "criteria">("job");
  const [jobData, setJobData] = useState<InsertJob | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleJobSubmit = async (data: InsertJob) => {
    try {
      // TODO: API call to create job
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("求人の作成に失敗しました");

      const result = await response.json();
      setJobId(result.id);
      setJobData(data);
      setStep("criteria");

      toast({
        title: "求人情報を保存しました",
        description: "続いて、採用基準を設定してください",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "予期せぬエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handleCriteriaSubmit = async (data: InsertRecruitmentCriteria) => {
    try {
      // TODO: API call to create recruitment criteria
      const response = await fetch("/api/recruitment-criteria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("採用基準の設定に失敗しました");

      toast({
        title: "採用基準を保存しました",
        description: "求人の作成が完了しました",
      });

      onOpenChange(false);
      setStep("job");
      setJobData(null);
      setJobId(null);
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "予期せぬエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            新規求人作成
          </DialogTitle>
          <DialogDescription>
            求人情報と採用基準を設定してください
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <Button
                variant={step === "job" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => step === "criteria" && jobData && setStep("job")}
                disabled={step === "criteria" && !jobData}
              >
                1. 求人情報
                {step === "criteria" && (
                  <Check className="ml-2 h-4 w-4 text-green-500" />
                )}
              </Button>
              <div className="mx-2 h-px w-16 bg-border" />
              <Button
                variant={step === "criteria" ? "default" : "outline"}
                className="rounded-full"
                disabled={!jobData}
              >
                2. 採用基準
              </Button>
            </div>
          </div>

          {step === "job" ? (
            <JobCreationForm
              onSubmit={handleJobSubmit}
              initialData={jobData || undefined}
            />
          ) : (
            jobId && (
              <RecruitmentCriteriaForm
                onSubmit={handleCriteriaSubmit}
                jobId={jobId}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```
