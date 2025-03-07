import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { SwitchField } from "./switch-field";
import { ProfileConfirmationModal } from "./profile-confirmation-modal";
import { talentProfileSchema } from "@shared/schema";

export function TalentForm() {
  const form = useForm({
    resolver: zodResolver(talentProfileSchema),
    defaultValues: {
      bodyMark: {
        hasBodyMark: false,
        details: "",
        others: []
      }
    }
  });

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  // デバッグ用のログ
  useEffect(() => {
    console.log("Form state:", {
      bodyMark: form.getValues("bodyMark"),
      formData: formData
    });
  }, [form, formData]);

  useEffect(() => {
    const existingProfile = undefined; // Replace with your actual existingProfile
    if (existingProfile) {
      console.log("Loading existing profile:", existingProfile);

      const bodyMarkData = {
        hasBodyMark: existingProfile.bodyMark?.hasBodyMark || false,
        details: existingProfile.bodyMark?.details || "",
        others: existingProfile.bodyMark?.others || []
      };

      form.reset({
        ...existingProfile,
        bodyMark: bodyMarkData
      });

      console.log("Form reset with data:", bodyMarkData);
    }
  }, [existingProfile, form]);

  const handleAddBodyMark = (value: string) => {
    if (value.trim()) {
      const currentBodyMark = form.getValues("bodyMark");
      const updatedOthers = [...(currentBodyMark.others || [])];

      if (!updatedOthers.includes(value)) {
        updatedOthers.push(value);

        form.setValue("bodyMark", {
          ...currentBodyMark,
          others: updatedOthers
        }, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });

        console.log("Added body mark:", value, "Updated others:", updatedOthers);
      }
    }
  };

  const handleRemoveBodyMark = (indexToRemove: number) => {
    const currentBodyMark = form.getValues("bodyMark");
    const updatedOthers = currentBodyMark.others.filter((_, index) => index !== indexToRemove);

    form.setValue("bodyMark", {
      ...currentBodyMark,
      others: updatedOthers
    }, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });

    console.log("Removed body mark at index:", indexToRemove, "Updated others:", updatedOthers);
  };

  const onSubmit = (data: any) => {
    console.log("Form submission started with data:", data);
    setFormData(data);
    setIsConfirmationOpen(true);
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            {/* Body mark section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">傷・タトゥー・アトピー</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="bodyMark.hasBodyMark"
                  render={({ field }) => (
                    <SwitchField
                      label="傷・タトゥー・アトピーの有無"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue("bodyMark", {
                            hasBodyMark: false,
                            details: "",
                            others: []
                          });
                        }
                      }}
                    />
                  )}
                />

                {form.watch("bodyMark.hasBodyMark") && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {/* 追加された項目の表示 */}
                      <div className="flex flex-wrap gap-2">
                        {form.watch("bodyMark.others")?.map((mark: string, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {mark}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveBodyMark(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>

                      {/* 新しい項目の追加フォーム */}
                      <OtherItemInput
                        onAdd={handleAddBodyMark}
                        placeholder="傷・タトゥー・アトピーの情報を入力"
                      />

                      {/* 詳細情報入力フィールド */}
                      <FormField
                        control={form.control}
                        name="bodyMark.details"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>詳細情報</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="傷・タトゥー・アトピーの詳細情報を入力してください"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Button type="submit">
                確認する
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <ProfileConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          setFormData(null);
        }}
        onConfirm={() => {}}
        formData={formData}
        isSubmitting={false}
      />
    </div>
  );
}