import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { prefectures } from "@/lib/constants";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const basicInfoSchema = z.object({
  username: z.string().min(1, "ニックネームを入力してください"),
  displayName: z.string().min(1, "本名を入力してください"),
  location: z.string().min(1, "居住地を選択してください"),
  preferredLocations: z.array(z.string()).min(1, "希望地域を選択してください"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "パスワードは8文字以上で入力してください").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "現在のパスワードを入力してください",
  path: ["currentPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "新しいパスワードと確認用パスワードが一致しません",
  path: ["confirmPassword"],
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  birthDate: string | null;
  location: string | null;
  preferredLocations: string[] | null;
}

interface UserUpdateResponse {
  message: string;
  user: UserProfile;
}

export default function BasicInfoEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading: isUserLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    queryFn: () => apiRequest<UserProfile>("GET", "/api/user/profile"),
    enabled: !!user,
  });

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      username: "",
      displayName: "",
      location: "",
      preferredLocations: [],
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        username: userProfile.username,
        displayName: userProfile.displayName || "",
        location: userProfile.location || "",
        preferredLocations: userProfile.preferredLocations || [],
      });
    }
  }, [userProfile, form.reset]);

  const updateProfileMutation = useMutation<UserUpdateResponse, Error, BasicInfoFormData>({
    mutationFn: async (updateData) => {
      const data = await apiRequest<UserUpdateResponse>("PATCH", "/api/user", {
        username: updateData.username,
        displayName: updateData.displayName,
        location: updateData.location,
        preferredLocations: updateData.preferredLocations,
        ...(updateData.newPassword && updateData.currentPassword ? {
          currentPassword: updateData.currentPassword,
          newPassword: updateData.newPassword,
        } : {})
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<UserProfile>(["/api/user/profile"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "プロフィールを更新しました",
        description: data.message,
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
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>本名</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>生年月日</FormLabel>
            <div className="p-3 bg-muted rounded-md">
              <p>{userProfile?.birthDate ? format(new Date(userProfile.birthDate), 'yyyy年MM月dd日', { locale: ja }) : '未設定'}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              ※生年月日の修正が必要な場合は、運営にお問い合わせください。
            </p>
          </div>

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

          <div className="space-y-4 border rounded-lg p-4">
            <h2 className="text-lg font-semibold">パスワード変更</h2>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>現在のパスワード</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新しいパスワード</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新しいパスワード（確認）</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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