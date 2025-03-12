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
import { getTalentProfile } from "@/lib/api/talent";

type TalentRegisterFormData = z.infer<typeof talentRegisterFormSchema>;
type LoginFormData = {
  email: string;
  password: string;
  role: "talent" | "store";
};

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"talent" | "store">("talent");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "talent"
    },
  });

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      console.log('Login attempt:', {
        email: data.email,
        role: data.role,
        timestamp: new Date().toISOString()
      });

      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        role: selectedRole
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "ログインエラー",
        description: error instanceof Error ? error.message : "ログインに失敗しました",
        variant: "destructive",
      });
    }
  };

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
      console.log('Form validation state:', {
        isValid,
        errors: registerForm.formState.errors,
        values: registerForm.getValues()
      });

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

      // プロフィールデータを取得
      const profileData = await getTalentProfile();
      console.log('Fetched profile data:', profileData);

      // フォームデータとプロフィールデータをマージ
      const mergedData = {
        ...profileData, // 既存のプロフィールデータを先に展開
        ...data, // フォームデータで上書き
      };

      console.log('Merged data:', mergedData);
      setFormData(mergedData);
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
    return <Redirect to={user.role === 'talent' ? "/talent/mypage" : "/store/dashboard"} />;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>SCAI へようこそ</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="talent">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="talent"
                  onClick={() => {
                    setSelectedRole("talent");
                    loginForm.setValue("role", "talent");
                  }}
                >
                  女性ログイン
                </TabsTrigger>
                <TabsTrigger
                  value="store"
                  onClick={() => {
                    setSelectedRole("store");
                    loginForm.setValue("role", "store");
                  }}
                >
                  店舗ログイン
                </TabsTrigger>
              </TabsList>

              <TabsContent value="talent">
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ログイン
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="store">
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ログイン
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}