import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as z from 'zod';

// ログインフォームのスキーマ定義
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です')
});

type LoginFormData = z.infer<typeof loginSchema>;

// 登録フォームのスキーマ定義
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  username: z.string().min(2, 'ユーザー名は2文字以上必要です'),
  password: z.string().min(8, 'パスワードは8文字以上必要です'),
  passwordConfirm: z.string()
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードが一致しません",
  path: ["passwordConfirm"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ログイン中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "登録中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>SCAIへようこそ</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">ログイン</TabsTrigger>
                <TabsTrigger value="register">新規登録</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input {...loginForm.register("email")} type="email" />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">パスワード</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ログイン
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input {...registerForm.register("email")} type="email" />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="username">ユーザー名</Label>
                    <Input {...registerForm.register("username")} />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">パスワード</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...registerForm.register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="passwordConfirm">パスワード（確認）</Label>
                    <div className="relative">
                      <Input
                        type={showPasswordConfirm ? "text" : "password"}
                        {...registerForm.register("passwordConfirm")}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      >
                        {showPasswordConfirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {registerForm.formState.errors.passwordConfirm && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.passwordConfirm.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    アカウントを作成
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 右側のヒーローセクション */}
      <div className="hidden md:flex flex-1 bg-primary/5 items-center justify-center p-8">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SCAI - AIを活用した求人マッチング
          </h1>
          <p className="text-xl text-muted-foreground">
            AIがあなたに最適な求人情報をご提案。効率的な求人探しをサポートします。
          </p>
        </div>
      </div>
    </div>
  );
}