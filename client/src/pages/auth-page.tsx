import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser, type LoginData, loginSchema, prefectures } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
      preferredLocations: [],
    },
  });

  const handleRegisterSubmit = async (data: InsertUser) => {
    console.log('Form Data before submission:', data);
    registerMutation.mutate(data);
  };

  if (user) {
    return <Redirect to={user.role === "store" ? "/store/dashboard" : "/talent/dashboard"} />;
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
                    <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}>
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
                            ※使用可能な半角記号：! # $ % ( ) + , - . / : = ? @ [ ] ^ _ ` { } |
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
                          <Controller
                            name="location"
                            control={registerForm.control}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="在住地を選択してください" />
                                </SelectTrigger>
                                <SelectContent>
                                  {prefectures.map((pref) => (
                                    <SelectItem key={pref} value={pref}>
                                      {pref}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
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
                          <Controller
                            name="preferredLocations"
                            control={registerForm.control}
                            render={({ field }) => (
                              <div className="grid grid-cols-2 gap-2">
                                {prefectures.map((pref) => (
                                  <div key={pref} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`pref-${pref}`}
                                      checked={field.value?.includes(pref)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        const newValue = checked
                                          ? [...currentValue, pref]
                                          : currentValue.filter((p) => p !== pref);
                                        field.onChange(newValue);
                                        console.log('Updated preferredLocations:', newValue);
                                      }}
                                    />
                                    <label
                                      htmlFor={`pref-${pref}`}
                                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {pref}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          />
                          {registerForm.formState.errors.preferredLocations && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.preferredLocations.message}
                            </p>
                          )}
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
                {/* Store registration form */}
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