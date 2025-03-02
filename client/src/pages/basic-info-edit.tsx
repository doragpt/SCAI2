import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Redirect, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const basicInfoSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください"),
  birthDate: z.string().min(1, "生年月日を入力してください"),
  location: z.string().min(1, "居住地を選択してください"),
  preferredLocations: z.array(z.string()).min(1, "希望地域を選択してください"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export default function BasicInfoEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/talent/profile"],
  });

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      birthDate: user?.birthDate ?? "",
      location: user?.location ?? "",
      preferredLocations: user?.preferredLocations ?? [],
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: BasicInfoFormData) => {
      const response = await fetch("/api/talent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("プロフィールの更新に失敗しました");
      }
      return response.json();
    },
    onSuccess: () => {
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
    setIsSubmitting(true);
    try {
      await updateProfileMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/talent/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">基本情報編集</h1>
          <div className="w-10" /> {/* スペーサー */}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>生年月日</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredLocations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>希望地域</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 送信ボタン */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              保存する
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}