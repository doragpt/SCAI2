import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  talentRegisterFormSchema,
  loginSchema,
  prefectures,
} from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AgeVerificationModal } from "@/components/age-verification-modal";
import { useToast } from "@/hooks/use-toast";
import * as z from 'zod';

type TalentRegisterFormData = z.infer<typeof talentRegisterFormSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [formData, setFormData] = useState<TalentRegisterFormData | null>(null);
  const { toast } = useToast();

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

  const handleDateChange = (type: 'year' | 'month' | 'day', value: number) => {
    if (type === 'year') setSelectedYear(value);
    if (type === 'month') setSelectedMonth(value);
    if (type === 'day') setSelectedDay(value);

    let dateStr = '';
    if (type === 'year' && selectedMonth && selectedDay) {
      dateStr = `${value}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    } else if (type === 'month' && selectedYear && selectedDay) {
      dateStr = `${selectedYear}-${String(value).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    } else if (type === 'day' && selectedYear && selectedMonth) {
      dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(value).padStart(2, '0')}`;
    }

    if (dateStr) {
      registerForm.setValue('birthDate', dateStr, { shouldValidate: true });
    }
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "talent",
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<TalentRegisterFormData>({
    resolver: zodResolver(talentRegisterFormSchema),
    defaultValues: {
      role: "talent",
      preferredLocations: [],
      birthDate: "",
      username: "",
      password: "",
      passwordConfirm: "",
      location: undefined,
      privacyPolicy: false,
    },
  });

  const handleRegisterSubmit = async (data: TalentRegisterFormData) => {
    try {
      // フォームのバリデーションチェック
      const isValid = await registerForm.trigger();
      if (!isValid) {
        const errors = registerForm.formState.errors;
        if (Object.keys(errors).length > 0) {
          const firstError = Object.values(errors)[0];
          toast({
            title: "入力エラー",
            description: firstError.message,
            variant: "destructive",
          });
        }
        return;
      }

      setFormData(data);
      setShowAgeVerification(true);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "エラー",
        description: "登録処理中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      loginMutation.mutate(data);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "エラー",
        description: "ログイン中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handleAgeVerification = (verified: boolean) => {
    setShowAgeVerification(false);
    if (verified && formData) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!formData) return;

    try {
      // Don't remove passwordConfirm and privacyPolicy here
      registerMutation.mutate(formData);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "エラー",
        description: "登録処理中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/talent/ai-matching" />;
  }

  return (
    <>
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
                      <Label htmlFor="email">
                        メールアドレス <span className="text-destructive">※</span>
                      </Label>
                      <Input {...registerForm.register("email")} type="email" />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

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
                      <div className="text-sm text-muted-foreground h-40 overflow-y-auto space-y-2 p-4">
                        <p>当社は、当社が運営する求人サイト（以下「本サイト」）をご利用いただく皆様（以下「会員」）のプライバシーを最大限に尊重し、会員の皆様からご提供いただいた個人情報の管理・運用に細心の注意を払います。</p>

                        <h4 className="font-medium mt-4">1. 個人情報の取得と利用目的</h4>
                        <p>当社は、本サイトを通じて会員から取得する個人情報について、以下の目的で利用いたします：</p>
                        <ul className="list-disc pl-4 space-y-2">
                          <li>サービス提供（求人情報のご案内、会員認証、サポート）</li>
                          <li>応募情報の開示（会員の同意に基づく企業への情報提供）</li>
                          <li>統計・分析（匿名化したデータによるサービス改善）</li>
                        </ul>

                        <h4 className="font-medium mt-4">2. 個人情報の管理</h4>
                        <p>当社は、個人情報の漏洩、紛失、改変を防止するため、適切なセキュリティ対策を実施しています。</p>

                        <h4 className="font-medium mt-4">3. 個人情報の第三者提供</h4>
                        <p>当社は、以下の場合を除き、会員の個人情報を第三者に提供することはありません：</p>
                        <ul className="list-disc pl-4 space-y-2">
                          <li>会員の同意がある場合</li>
                          <li>法令に基づく場合</li>
                          <li>人の生命、身体または財産の保護のために必要な場合</li>
                        </ul>

                        <h4 className="font-medium mt-4">4. 個人情報提供の重要性</h4>
                        <p>会員が本サイトの各サービスをご利用いただくためには、必要な情報の入力が求められます。なお、必須項目の入力がなされない場合、当該サービスのご利用が制限される場合がありますので、ご了承ください。</p>

                        <h4 className="font-medium mt-4">5. 応募先企業での個人情報管理</h4>
                        <p>会員の同意のもと応募先企業に提供された個人情報は、各企業が独自に定めた個人情報管理規程に従って厳重に管理されます。当社は、各企業に対して適切な管理体制の維持を求めるとともに、会員の個人情報が目的外に使用されないよう啓蒙活動を行います。</p>

                        <h4 className="font-medium mt-4">6. 会員の権利と情報変更</h4>
                        <p>会員は、登録された個人情報の内容について、いつでも開示、訂正、削除、または利用停止を求める権利を有します。その際には、本人確認のため、氏名、住所、電話番号、生年月日、メールアドレスなどの情報をもとに手続きを進めさせていただきます。</p>

                        <h4 className="font-medium mt-4">7. SSLおよびクッキーの利用</h4>
                        <p>本サイトでは、個人情報の送受信時にSSL（Secure Sockets Layer）による暗号化を実施し、安全な通信を確保しています。また、サイトの利便性向上のため、一部でクッキー（Cookie）を利用しております。ブラウザの設定によりクッキーの受け入れを拒否することも可能ですが、その場合、本サイトの一部サービスがご利用いただけなくなる可能性があります。</p>

                        <h4 className="font-medium mt-4">8. 個人情報の管理および外部委託</h4>
                        <p>当社は、取得した個人情報の漏洩、紛失、改変などを防止するため、最新のセキュリティ対策を講じた安全な環境下で個人情報を管理します。また、必要な範囲内で個人情報の取扱いを外部に委託する場合、その委託先は厳格な個人情報保護の基準を満たす業者を選定し、適切な契約を締結します。</p>
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

      {/* 年齢確認ダイアログ */}
      <AgeVerificationModal
        open={showAgeVerification}
        onOpenChange={setShowAgeVerification}
        onVerify={handleAgeVerification}
      />

      {/* 確認ダイアログ */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>入力内容の確認</DialogTitle>
            <DialogDescription>
              以下の内容で登録を行います。入力内容に間違いがないことをご確認ください。
            </DialogDescription>
          </DialogHeader>
          {formData && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">ニックネーム</p>
                <p>{formData.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium">メールアドレス</p>
                <p>{formData.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">生年月日</p>
                <p>{formData.birthDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium">居住地</p>
                <p>{formData.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium">希望地域</p>
                <p>{formData.preferredLocations.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium">姓（カナ）</p>
                <p>{formData.lastNameKana}</p>
              </div>
              <div>
                <p className="text-sm font-medium">名（カナ）</p>
                <p>{formData.firstNameKana}</p>
              </div>
              <div>
                <p className="text-sm font-medium">最寄り駅</p>
                <p>{formData.nearestStation}</p>
              </div>
              <div>
                <p className="text-sm font-medium">身長</p>
                <p>{formData.height}cm</p>
              </div>
              <div>
                <p className="text-sm font-medium">体重</p>
                <p>{formData.weight}kg</p>
              </div>
              <div>
                <p className="text-sm font-medium">カップサイズ</p>
                <p>{formData.cupSize}</p>
              </div>
              <div>
                <p className="text-sm font-medium">パネルの顔出し設定</p>
                <p>{formData.faceVisibility}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  ※生年月日は一度登録すると変更できません。お間違えのないようご確認ください。
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              戻る
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              登録する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}