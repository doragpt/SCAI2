import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

type LoginFormData = z.infer<typeof loginSchema>;

export default function ManagerLogin() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginMutation, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // ログイン済みの場合のリダイレクト処理を修正
  useEffect(() => {
    // ログインページ以外でのみリダイレクトを行う
    if (user && user.role === "store" && location !== "/manager/login") {
      setLocation("/store/dashboard");
    }
  }, [user, location, setLocation]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "store"
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      console.log('店舗ログイン試行:', {
        username: data.username,
        timestamp: new Date().toISOString()
      });

      await loginMutation.mutateAsync(data);

      console.log('店舗ログイン成功:', {
        timestamp: new Date().toISOString()
      });

      // ログイン成功時は店舗ダッシュボードへ
      setLocation("/store/dashboard");
    } catch (error) {
      console.error('店舗ログインエラー:', {
        error,
        timestamp: new Date().toISOString()
      });

      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "ログインに失敗しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>店舗管理システム</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ログインID</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ログイン
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}