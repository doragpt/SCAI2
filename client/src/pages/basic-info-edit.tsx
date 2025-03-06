import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Redirect, Link } from "wouter";
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

export default function BasicInfoEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/talent/profile"],
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
    if (profile && user) {
      form.reset({
        username: user.username,
        displayName: user.displayName,
        location: user.location,
        preferredLocations: user.preferredLocations || [],
      });
    }
  }, [profile, user, form.reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: BasicInfoFormData) => {
      try {
        const response = await apiRequest("PATCH", "/api/user", {
          username: updateData.username,
          displayName: updateData.displayName,
          location: updateData.location,
          preferredLocations: updateData.preferredLocations,
          ...(updateData.newPassword && updateData.currentPassword ? {
            currentPassword: updateData.currentPassword,
            newPassword: updateData.newPassword,
          } : {})
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "プロフィールの更新に失敗しました");
        }

        return await response.json();
      } catch (error) {
        console.error('プロフィール更新エラー:', error);
        throw error instanceof Error ? error : new Error("プロフィールの更新に失敗しました");
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "プロフィールを更新しました",
        description: "基本情報の変更が保存されました。",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/talent/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">基本情報編集</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
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
                <p>{user.birthDate ? format(new Date(user.birthDate), 'yyyy年MM月dd日', { locale: ja }) : '未設定'}</p>
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
      </main>
    </div>
  );
}