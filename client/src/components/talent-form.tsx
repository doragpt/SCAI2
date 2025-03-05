import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch as SwitchField } from "@/components/ui/switch"; // Renamed for clarity
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, X, ChevronDown, Camera } from "lucide-react";
import { Link } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, QUERY_KEYS } from "@/lib/queryClient";
import { ProfileConfirmationModal } from "./profile-confirmation-modal";
import {
  allergyTypes,
  smokingTypes,
  cupSizes,
  faceVisibilityTypes,
  commonNgOptions,
  idTypes as availableIdTypes,
  prefectures,
  estheOptions,
  photoTags,
  type TalentProfileData,
  type Photo,
  talentProfileSchema,
} from "@shared/schema";

// Store type definitions
type CurrentStore = {
  storeName: string;
  stageName: string;
};

type PreviousStore = {
  storeName: string;
  photoDiaryUrls: string[];
};

// メインのTalentFormコンポーネント
export function TalentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [otherIds, setOtherIds] = useState<string[]>([]);
  const [newPhotoDiaryUrl, setNewPhotoDiaryUrl] = useState("");

  const form = useForm<TalentProfileData>({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      availableIds: { types: [], others: [] },
      canProvideResidenceRecord: false,
      currentStores: [],
      previousStores: [],
      photoDiaryUrls: [],
      bodyMark: { hasBodyMark: false, details: "" },
      snsUrls: [],
      photos: [],
      selfIntroduction: "",
      notes: "",
    },
  });

  // 身分証明書関連のハンドラー
  const handleAddOtherId = (value: string) => {
    if (!value || otherIds.includes(value)) return;
    const updatedIds = [...otherIds, value];
    setOtherIds(updatedIds);
    form.setValue("availableIds.others", updatedIds);
  };

  const handleRemoveOtherId = (idToRemove: string) => {
    const updatedIds = otherIds.filter((id) => id !== idToRemove);
    setOtherIds(updatedIds);
    form.setValue("availableIds.others", updatedIds);
  };

  // 写メ日記URL関連のハンドラー
  const handleAddPhotoDiaryUrl = () => {
    if (!newPhotoDiaryUrl) return;
    const currentUrls = form.getValues("photoDiaryUrls") || [];
    form.setValue("photoDiaryUrls", [...currentUrls, newPhotoDiaryUrl]);
    setNewPhotoDiaryUrl("");
  };

  const handleRemovePhotoDiaryUrl = (index: number) => {
    const currentUrls = form.getValues("photoDiaryUrls") || [];
    form.setValue("photoDiaryUrls", currentUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: TalentProfileData) => {
    setIsPending(true);
    try {
      // Handle form submission
      setIsConfirmationOpen(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "エラーが発生しました",
        description: "フォームの送信に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* 身分証明書セクション */}
            <div>
              <h3 className="text-lg font-semibold mb-4">身分証明書</h3>
              <FormFieldWrapper label="持参可能な身分証明書" required>
                <div className="space-y-4">
                  {/* 既存の身分証明書チェックボックス */}
                  <div className="grid grid-cols-2 gap-4">
                    {availableIdTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`id-${type}`}
                          checked={form.watch("availableIds.types").includes(type)}
                          onCheckedChange={(checked) => {
                            const current = form.watch("availableIds.types") || [];
                            const updated = checked
                              ? [...current, type]
                              : current.filter((t) => t !== type);
                            form.setValue("availableIds.types", updated);
                          }}
                        />
                        <Label htmlFor={`id-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>

                  {/* その他の身分証明書 */}
                  <div className="space-y-2">
                    <Label>その他の身分証明書</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {otherIds.map((id) => (
                        <Badge key={id} variant="secondary">
                          {id}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => handleRemoveOtherId(id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="その他の身分証明書を入力"
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            handleAddOtherId(e.currentTarget.value.trim());
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enterキーで追加できます
                    </p>
                  </div>
                </div>
              </FormFieldWrapper>
            </div>

            {/* 本籍地記載の住民票 */}
            <FormField
              control={form.control}
              name="canProvideResidenceRecord"
              render={({ field }) => (
                <SwitchField
                  label="本籍地記載の住民票の提出 可否"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />

            {/* 写メ日記URL */}
            <div>
              <h3 className="text-lg font-semibold mb-4">写メ日記URL</h3>
              <div className="space-y-4">
                {form.watch("photoDiaryUrls")?.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => {
                        const updatedUrls = [...form.getValues("photoDiaryUrls")];
                        updatedUrls[index] = e.target.value;
                        form.setValue("photoDiaryUrls", updatedUrls);
                      }}
                      placeholder="写メ日記のURLを入力"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemovePhotoDiaryUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="写メ日記のURLを入力"
                    value={newPhotoDiaryUrl}
                    onChange={(e) => setNewPhotoDiaryUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddPhotoDiaryUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddPhotoDiaryUrl}
                    disabled={!newPhotoDiaryUrl}
                  >
                    追加
                  </Button>
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="sticky bottom-0 bg-background border-t p-4 -mx-4">
              <div className="container mx-auto flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    "保存する"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </main>

      <ProfileConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={() => {
          setIsConfirmationOpen(false);
          // Handle confirmation
        }}
        formData={form.getValues()}
        isPending={isPending}
      />
    </div>
  );
}