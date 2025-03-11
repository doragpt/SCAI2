import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { prefectures } from "@shared/schema";
import type { UserResponse } from "@shared/schema";

const basicInfoSchema = z.object({
  username: z.string().min(1, "ニックネームを入力してください"),
  location: z.string().min(1, "居住地を選択してください"),
  preferredLocations: z.array(z.string()).min(1, "希望地域を選択してください"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export default function BasicInfoEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading: isUserLoading } = useQuery<UserResponse>({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ユーザー情報の取得に失敗しました");
      }
      const data = await response.json();
      console.log('API Response:', data); // デバッグ用
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      username: "",
      location: "",
      preferredLocations: [],
    },
  });

  useEffect(() => {
    if (userProfile) {
      console.log('Setting form values:', {
        username: userProfile.username,
        location: userProfile.location,
        preferredLocations: userProfile.preferredLocations
      });

      form.reset({
        username: userProfile.username,
        location: userProfile.location,
        preferredLocations: Array.isArray(userProfile.preferredLocations) 
          ? userProfile.preferredLocations 
          : [],
      });
    }
  }, [userProfile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: BasicInfoFormData) => {
      console.log('Sending update data:', data);

      const response = await apiRequest("PATCH", "/api/user", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "プロフィールの更新に失敗しました");
      }

      const result = await response.json();
      console.log('Update response:', result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.USER], data);
      toast({
        title: "プロフィールを更新しました",
        description: "変更が保存されました。",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラーが発生しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BasicInfoFormData) => {
    console.log('Form submission data:', data);
    await updateProfileMutation.mutateAsync(data);
  };

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-semibold mb-6">基本情報編集</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ニックネーム</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>居住地</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredLocations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>希望地域（複数選択可）</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {prefectures.map((pref) => (
                    <div key={pref} className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value?.includes(pref)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), pref]
                            : (field.value || []).filter((value) => value !== pref);
                          field.onChange(newValue);
                        }}
                      />
                      <label className="text-sm">{pref}</label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            更新する
          </Button>
        </form>
      </Form>
    </div>
  );
}