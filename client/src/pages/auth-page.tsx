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
import {
  talentRegisterFormSchema,
  type InsertUser,
  type LoginData,
  loginSchema,
  prefectures
} from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";

type TalentRegisterFormData = ReturnType<typeof talentRegisterFormSchema.parse>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // 生年月日用のドロップダウンの選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - 18 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedMonth, setSelectedMonth] = useState<number>();
  const [selectedDay, setSelectedDay] = useState<number>();

  const getDaysInMonth = (year?: number, month?: number) => {
    if (!year || !month) return [];
    return Array.from(
      { length: new Date(year, month, 0).getDate() },
      (_, i) => i + 1
    );
  };

  const days = getDaysInMonth(selectedYear, selectedMonth);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "talent",
    },
  });

  const registerForm = useForm<TalentRegisterFormData>({
    resolver: zodResolver(talentRegisterFormSchema),
    defaultValues: {
      role: "talent" as const,
      preferredLocations: [],
      birthDate: "",
      username: "",
      password: "",
      passwordConfirm: "",
      displayName: "",
      location: undefined,
      privacyPolicy: false,
    },
  });

  const handleDateChange = (type: 'year' | 'month' | 'day', value: number) => {
    if (type === 'year') setSelectedYear(value);
    if (type === 'month') setSelectedMonth(value);
    if (type === 'day') setSelectedDay(value);

    if (selectedYear && selectedMonth && selectedDay) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      registerForm.setValue('birthDate', dateStr, { shouldValidate: true });
    }
  };

  const handleRegisterSubmit = async (data: TalentRegisterFormData) => {
    try {
      console.log('Form Data before submission:', data);

      // Remove confirmation fields before submission
      const { passwordConfirm, privacyPolicy, ...submitData } = data;

      console.log('Processed Form Data:', submitData);
      registerMutation.mutate(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (user) {
    return <Redirect to="/" />;
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
                <Tabs defaultValue="register">
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
                          <Label>
                            生年月日 <span className="text-destructive">※</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            ※18歳未満、高校生は登録できません
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <Select onValueChange={(value) => handleDateChange('year', Number(value))}>
                              <SelectTrigger>
                                <SelectValue placeholder="年" />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}年
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={(value) => handleDateChange('month', Number(value))}>
                              <SelectTrigger>
                                <SelectValue placeholder="月" />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem key={month} value={month.toString()}>
                                    {month}月
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              onValueChange={(value) => handleDateChange('day', Number(value))}
                              disabled={!selectedYear || !selectedMonth}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="日" />
                              </SelectTrigger>
                              <SelectContent>
                                {days.map((day) => (
                                  <SelectItem key={day} value={day.toString()}>
                                    {day}日
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
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
                            ※使用可能な半角記号：! # $ % ( ) + , - . / : = ? @ [ ] ^ _ ` |
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
                          <Label htmlFor="passwordConfirm">
                            パスワード（確認） <span className="text-destructive">※</span>
                          </Label>
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

                        <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                          <h3 className="font-medium">個人情報の取り扱いについて</h3>
                          <div className="text-sm text-muted-foreground h-40 overflow-y-auto space-y-2">
                            <p>当社は、当社が運営する求人サイト（以下「本サイト」）をご利用いただく皆様（以下「会員」）のプライバシーを最大限に尊重し、会員の皆様からご提供いただいた個人情報の管理・運用に細心の注意を払います。以下、本サイトにおける個人情報の取り扱いの基本方針とその利用目的、管理方法についてご説明いたします。</p>

                            <p>1. 個人情報の取得と利用目的</p>
                            <p>当社は、本サイトを通じて会員から取得する個人情報について、以下の目的で利用いたします。</p>
                            <ul className="list-disc pl-4">
                              <li>サービス提供のため</li>
                              <li>応募情報の開示のため</li>
                              <li>統計・分析目的のため</li>
                            </ul>

                            <p>2. 個人情報提供の重要性</p>
                            <p>会員が本サイトの各サービスをご利用いただくためには、必要な情報の入力が求められます。なお、必須項目の入力がなされない場合、当該サービスのご利用が制限される場合がありますので、ご了承ください。</p>

                            <p>3. 個人情報の第三者提供について</p>
                            <p>当社は、会員の個人情報を、原則として本人の同意なく第三者へ提供することはいたしません。ただし、以下の場合には、関係法令に基づき、会員の同意を得ずに個人情報を提供する場合があります。</p>
                            <ul className="list-disc pl-4">
                              <li>公衆衛生の向上や児童の健全育成のため、緊急かつ必要と判断される場合</li>
                              <li>国や地方公共団体、またはその委託先が法令に基づく業務を遂行するために必要な場合</li>
                              <li>裁判所、検察庁、警察等、権限を有する機関から開示を求められた場合</li>
                              <li>会員ご本人が明示的に第三者への開示を求めた場合</li>
                              <li>その他、法令で認められている場合</li>
                            </ul>

                            <p>4. 個人情報の管理および外部委託</p>
                            <p>当社は、取得した個人情報の漏洩、紛失、改変などを防止するため、最新のセキュリティ対策を講じた安全な環境下で個人情報を管理します。また、必要な範囲内で個人情報の取扱いを外部に委託する場合、その委託先は厳格な個人情報保護の基準を満たす業者を選定し、適切な契約を締結します。</p>

                            <p>5. 会員の権利と情報変更</p>
                            <p>会員は、登録された個人情報の内容について、いつでも開示、訂正、削除、または利用停止を求める権利を有します。その際には、本人確認のため、氏名、住所、電話番号、生年月日、メールアドレスなどの情報をもとに手続きを進めさせていただきます。</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="privacyPolicy"
                              checked={registerForm.watch("privacyPolicy")}
                              onCheckedChange={(checked) => {
                                registerForm.setValue("privacyPolicy", checked === true, {
                                  shouldValidate: true
                                });
                              }}
                            />
                            <label
                              htmlFor="privacyPolicy"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              個人情報の取り扱いについて同意する
                            </label>
                          </div>
                          {registerForm.formState.errors.privacyPolicy && (
                            <p className="text-sm text-destructive">
                              {registerForm.formState.errors.privacyPolicy.message}
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