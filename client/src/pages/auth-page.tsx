import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser, type LoginData, loginSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";

const PREFECTURES = [
  "北海道", "青森県", "秋田県", "岩手県", "山形県", "福島県", "宮城県",
  "群馬県", "栃木県", "茨城県", "東京都", "神奈川県", "千葉県", "埼玉県",
  "愛知県", "静岡県", "三重県", "岐阜県", "山梨県", "長野県", "新潟県", "富山県", "石川県", "福井県",
  "大阪府", "京都府", "兵庫県", "奈良県", "和歌山県", "滋賀県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "talent",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      role: "talent",
    },
  });

  const storeLoginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "store",
    },
  });

  const storeRegisterForm = useForm<InsertUser>({
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
                          <Label htmlFor="username">ニックネーム</Label>
                          <Input {...loginForm.register("username")} />
                          {loginForm.formState.errors.username && (
                            <p className="text-sm text-destructive mt-1">
                              {loginForm.formState.errors.username.message}
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
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">
                            ニックネーム <span className="text-destructive">※</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            （全角/半角10文字以内）※絵文字・記号の使用はできません
                          </p>
                          <Input {...registerForm.register("username")} />
                          {registerForm.formState.errors.username && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="birthDate">
                            生年月日 <span className="text-destructive">※</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            ※18歳未満、高校生は登録できません
                          </p>
                          <Input 
                            type="date"
                            {...registerForm.register("birthDate", { 
                              valueAsDate: true 
                            })} 
                          />
                          {registerForm.formState.errors.birthDate && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.birthDate.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="password">
                            パスワード <span className="text-destructive">※</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            ※文字は半角8文字以上48文字以内<br />
                            半角英字小文字、半角数字はそれぞれ1種類以上必須<br />
                            (半角記号は任意)<br />
                            ※半角記号は!#$%()+,-./:=?@[]^_`{|}が入力可能
                          </p>
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
                          <Label htmlFor="displayName">
                            お名前 <span className="text-destructive">※</span>
                          </Label>
                          <Input {...registerForm.register("displayName")} />
                          {registerForm.formState.errors.displayName && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.displayName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="location">
                            在住地 <span className="text-destructive">※</span>
                          </Label>
                          <Input 
                            {...registerForm.register("location")} 
                            placeholder="例: 東京都渋谷区" 
                          />
                          {registerForm.formState.errors.location && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.location.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>
                            働きたい地域 <span className="text-destructive">※</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            （複数選択可）
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {PREFECTURES.map((pref) => (
                              <div key={pref} className="flex items-center space-x-2">
                                <Checkbox id={`pref-${pref}`} />
                                <label
                                  htmlFor={`pref-${pref}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {pref}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <span className="text-destructive">※</span>は必須項目です
                        </p>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
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
                    <form onSubmit={storeLoginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">店舗ID</Label>
                          <Input {...storeLoginForm.register("username")} />
                          {storeLoginForm.formState.errors.username && (
                            <p className="text-sm text-destructive mt-1">
                              {storeLoginForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="password">パスワード</Label>
                          <Input type="password" {...storeLoginForm.register("password")} />
                          {storeLoginForm.formState.errors.password && (
                            <p className="text-sm text-destructive mt-1">
                              {storeLoginForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          店舗管理画面へログイン
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={storeRegisterForm.handleSubmit((data) => {
                      const storeData = {
                        ...data,
                        role: "store" as const,
                      };
                      registerMutation.mutate(storeData);
                    })}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">店舗ID</Label>
                          <Input {...storeRegisterForm.register("username")} />
                          {storeRegisterForm.formState.errors.username && (
                            <p className="text-sm text-destructive mt-1">
                              {storeRegisterForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="password">パスワード</Label>
                          <Input 
                            type="password" 
                            {...storeRegisterForm.register("password")} 
                          />
                          {storeRegisterForm.formState.errors.password && (
                            <p className="text-sm text-destructive mt-1">
                              {storeRegisterForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="displayName">店舗名</Label>
                          <Input {...storeRegisterForm.register("displayName")} />
                          {storeRegisterForm.formState.errors.displayName && (
                            <p className="text-sm text-destructive mt-1">
                              {storeRegisterForm.formState.errors.displayName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="location">所在地</Label>
                          <Input 
                            {...storeRegisterForm.register("location")} 
                            placeholder="例: 東京都渋谷区" 
                          />
                          {storeRegisterForm.formState.errors.location && (
                            <p className="text-sm text-destructive mt-1">
                              {storeRegisterForm.formState.errors.location.message}
                            </p>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
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