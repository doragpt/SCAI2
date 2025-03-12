import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LoginFormData = {
  email: string;
  password: string;
};

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      console.log('ログインフォーム送信:', {
        email: data.email,
        timestamp: new Date().toISOString()
      });

      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error('ログインエラー:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "ログインに失敗しました",
      });
    }
  };

  if (user) {
    const redirectPath = user.role === 'store' ? '/store/dashboard' : '/talent/mypage';
    return <Redirect to={redirectPath} />;
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
                {/*<TabsTrigger value="register">新規登録</TabsTrigger>*/}
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input 
                      {...loginForm.register("email")} 
                      type="email" 
                      autoComplete="email"
                    />
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
                        {...loginForm.register("password")}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    ログイン
                  </Button>
                </form>
              </TabsContent>

              {/*<TabsContent value="register">
                {/* 登録フォームの内容は省略 */}
              {/*</TabsContent>*/}
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