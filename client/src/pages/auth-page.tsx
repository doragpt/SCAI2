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
  prefectures
} from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AgeVerificationModal } from "@/components/age-verification-modal";
import { useToast } from "@/hooks/use-toast";
import * as z from 'zod';

type TalentRegisterFormData = z.infer<typeof talentRegisterFormSchema>;

export default function AuthPage() {
  const { user, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [formData, setFormData] = useState<TalentRegisterFormData | null>(null);
  const { toast } = useToast();

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

  // 登録フォームの送信処理
  const handleRegisterSubmit = async (data: TalentRegisterFormData) => {
    console.log("フォーム送信処理開始", data);
    try {
      if (!data.birthDate) {
        toast({
          title: "エラー",
          description: "生年月日を入力してください",
          variant: "destructive",
        });
        return;
      }

      // フォームデータを保存
      setFormData(data);

      // 年齢確認ダイアログを表示
      console.log("年齢確認ダイアログを表示");
      setShowAgeVerification(true);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "エラー",
        description: "フォームの送信中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // 年齢確認後の処理
  const handleAgeVerification = (verified: boolean) => {
    console.log("年齢確認結果:", verified);
    setShowAgeVerification(false);
    if (verified && formData) {
      localStorage.setItem("age-verified", "true");
      setShowConfirmation(true);
    }
  };

  // 登録確認後の処理
  const handleConfirmRegistration = async () => {
    if (!formData) return;

    try {
      const { passwordConfirm, privacyPolicy, ...submitData } = formData;
      registerMutation.mutate(submitData);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Registration confirmation error:', error);
      toast({
        title: "エラー",
        description: "登録処理中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/talent/dashboard" />;
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
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
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
                    <Input
                      type="date"
                      {...registerForm.register("birthDate")}
                      max={new Date(
                        Date.now() - 18 * 365 * 24 * 60 * 60 * 1000
                      ).toISOString().split("T")[0]}
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
                      {/* プライバシーポリシーの内容 */}
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

      {/* 年齢確認ダイアログ */}
      <AgeVerificationModal
        open={showAgeVerification}
        onOpenChange={setShowAgeVerification}
        onVerify={handleAgeVerification}
      />

      {/* 確認ダイアログ */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
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
                <p className="text-sm font-medium">お名前</p>
                <p>{formData.displayName}</p>
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