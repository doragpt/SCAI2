import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      role: "talent",
    },
  });

  const storeLoginForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
  });

  const storeRegisterForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      role: "store",
    },
  });

  if (user) {
    return <Redirect to={user.role === "store" ? "/store/dashboard" : "/talent/register"} />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>SCAIへようこそ</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="talent">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="talent">女性の方</TabsTrigger>
                <TabsTrigger value="store">店舗様</TabsTrigger>
              </TabsList>

              <TabsContent value="talent">
                <Tabs defaultValue="login">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">ログイン</TabsTrigger>
                    <TabsTrigger value="register">新規登録</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">ユーザー名</Label>
                          <Input {...loginForm.register("username")} />
                        </div>
                        <div>
                          <Label htmlFor="password">パスワード</Label>
                          <Input type="password" {...loginForm.register("password")} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          ログイン
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">ユーザー名</Label>
                          <Input {...registerForm.register("username")} />
                        </div>
                        <div>
                          <Label htmlFor="password">パスワード</Label>
                          <Input type="password" {...registerForm.register("password")} />
                        </div>
                        <div>
                          <Label htmlFor="displayName">お名前</Label>
                          <Input {...registerForm.register("displayName")} />
                        </div>
                        <div>
                          <Label htmlFor="age">年齢</Label>
                          <Input type="number" {...registerForm.register("age", { valueAsNumber: true })} />
                        </div>
                        <div>
                          <Label htmlFor="location">在住地</Label>
                          <Input {...registerForm.register("location")} placeholder="例: 東京都渋谷区" />
                        </div>
                        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                          {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          AIマッチングを利用する（無料登録）
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="store">
                <Tabs defaultValue="login">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">ログイン</TabsTrigger>
                    <TabsTrigger value="register">新規登録</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={storeLoginForm.handleSubmit((data) => loginMutation.mutate({ ...data, role: "store" }))}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">店舗ID</Label>
                          <Input {...storeLoginForm.register("username")} />
                        </div>
                        <div>
                          <Label htmlFor="password">パスワード</Label>
                          <Input type="password" {...storeLoginForm.register("password")} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          店舗管理画面へログイン
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={storeRegisterForm.handleSubmit((data) => registerMutation.mutate({...data, role: "store"}))}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">店舗ID</Label>
                          <Input {...storeRegisterForm.register("username")} />
                        </div>
                        <div>
                          <Label htmlFor="password">パスワード</Label>
                          <Input type="password" {...storeRegisterForm.register("password")} />
                        </div>
                        <div>
                          <Label htmlFor="displayName">店舗名</Label>
                          <Input {...storeRegisterForm.register("displayName")} />
                        </div>
                        <div>
                          <Label htmlFor="location">所在地</Label>
                          <Input {...storeRegisterForm.register("location")} placeholder="例: 東京都渋谷区" />
                        </div>
                        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                          {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          店舗登録する（無料）
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="hidden md:flex items-center justify-center bg-primary/5 p-8">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SCAI - AIを活用した求人マッチング
          </h1>
          <p className="text-lg text-muted-foreground">
            AIがあなたに最適な求人情報をご提案。効率的な求人探しをサポートします。
          </p>
        </div>
      </div>
    </div>
  );
}