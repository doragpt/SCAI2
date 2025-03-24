import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeProfileSchema, type StoreProfile, type JobStatus, benefitTypes, benefitCategories } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, Plus, X, Phone, Mail, Link, Building, User, Banknote, Clock, Info, Check, Shield, MapPin, MessageSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import { JobEditor } from "@/components/job-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type JobFormProps = {
  initialData?: StoreProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function JobFormTabs({ initialData, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catchPhraseLength, setCatchPhraseLength] = useState(initialData?.catch_phrase?.length || 0);
  const [descriptionLength, setDescriptionLength] = useState(initialData?.description?.length || 0);
  const [isUploadingTopImage, setIsUploadingTopImage] = useState(false);
  
  // フォームの初期化
  const form = useForm<StoreProfile>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      ...initialData,
      // 基本情報
      catch_phrase: initialData?.catch_phrase || "",
      description: initialData?.description || "",
      top_image: initialData?.top_image || "",
      
      // 給与情報
      benefits: initialData?.benefits || [],
      minimum_guarantee: initialData?.minimum_guarantee || 0,
      maximum_guarantee: initialData?.maximum_guarantee || 0,
      working_time_hours: initialData?.working_time_hours || 0,
      average_hourly_pay: initialData?.average_hourly_pay || 0,
      status: initialData?.status || "draft",
      
      // 住所・担当者情報
      address: initialData?.address || "",
      recruiter_name: initialData?.recruiter_name || "",
      
      // 連絡先情報 - 配列が空でないことを確認
      phone_numbers: Array.isArray(initialData?.phone_numbers) && initialData.phone_numbers.length > 0 
        ? initialData.phone_numbers 
        : [''],
      email_addresses: Array.isArray(initialData?.email_addresses) 
        ? initialData.email_addresses 
        : [],
      
      // SNS情報
      sns_id: initialData?.sns_id || "",
      sns_url: initialData?.sns_url || "",
      sns_text: initialData?.sns_text || "",
      
      // ウェブサイト情報
      pc_website_url: initialData?.pc_website_url || "",
      mobile_website_url: initialData?.mobile_website_url || "",
      
      // 応募要件
      application_requirements: initialData?.application_requirements || "",
      
      // 追加フィールド
      access_info: initialData?.access_info || "",
      security_measures: initialData?.security_measures || "",
      
      // サポート情報
      transportation_support: initialData?.transportation_support || false,
      housing_support: initialData?.housing_support || false,
    }
  });
  
  // フィールド配列の設定
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: "phone_numbers"
  });
  
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: "email_addresses"
  });
  
  // 電話番号操作
  const addPhoneNumber = () => {
    if (phoneFields.length < 4) {
      appendPhone("");
    }
  };
  
  // メールアドレス操作
  const addEmailAddress = () => {
    if (emailFields.length < 4) {
      appendEmail("");
    }
  };
  
  // TOP画像アップロード処理
  const handleTopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploadingTopImage(true);
      
      // FormDataを準備
      const formData = new FormData();
      formData.append('file', file);
      
      // ファイルをアップロード
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '画像のアップロードに失敗しました');
      }
      
      const data = await response.json();
      form.setValue('top_image', data.url);
      
      toast({
        title: "店舗TOP画像をアップロードしました",
        description: "画像が正常にアップロードされました。"
      });
    } catch (error) {
      console.error('TOP画像アップロードエラー:', error);
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "画像のアップロードに失敗しました"
      });
    } finally {
      setIsUploadingTopImage(false);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: StoreProfile) => {
      try {
        // データを整形
        const formattedData = {
          // 基本項目
          catch_phrase: data.catch_phrase || "",
          description: data.description || "",
          top_image: data.top_image || "",
          recruiter_name: data.recruiter_name || "",
          
          // 数値項目
          minimum_guarantee: Number(data.minimum_guarantee) || 0,
          maximum_guarantee: Number(data.maximum_guarantee) || 0,
          working_time_hours: Number(data.working_time_hours) || 0,
          average_hourly_pay: Number(data.average_hourly_pay) || 0,
          
          // 配列と特別な項目
          status: data.status || "draft",
          benefits: data.benefits || [],
          phone_numbers: data.phone_numbers,
          email_addresses: data.email_addresses,
          
          // 文字列項目
          address: data.address || "",
          sns_id: data.sns_id || "",
          sns_url: data.sns_url || "",
          sns_text: data.sns_text || "",
          pc_website_url: data.pc_website_url || "",
          mobile_website_url: data.mobile_website_url || "",
          application_requirements: data.application_requirements || "",
          
          // 新規追加項目
          access_info: data.access_info || "",
          security_measures: data.security_measures || "",
          
          // benefits内に含まれるため削除（交通費支給、寮完備）
          transportation_support: false,
          housing_support: false,
          
          // 必須項目
          working_hours: data.working_hours || "",
          requirements: data.requirements || "",
        };
        
        console.log("送信データ:", formattedData);
        
        // フェッチAPIを直接使用して詳細なエラーハンドリングを実装
        // app.tsでは /api/store のエンドポイント設定があり、store.tsでは /profile を処理
        const response = await fetch('/store/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedData),
          credentials: 'include' // 認証情報（Cookie）を含める
        });
        
        console.log("リクエスト結果:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          // ヘッダー情報を単純化して表示
          headers: {
            contentType: response.headers.get('content-type'),
            server: response.headers.get('server')
          }
        });
        
        if (!response.ok) {
          // エラーレスポンスの場合は詳細情報を出力
          const errorText = await response.text();
          console.error("エラーレスポンス:", {
            status: response.status,
            text: errorText
          });
          
          try {
            // JSONパースを試みる
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `エラー: ${response.status} ${response.statusText}`);
          } catch (parseError) {
            // JSONパースに失敗した場合はテキストそのままを表示
            throw new Error(`エラー: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
          }
        }
        
        // 成功した場合はJSONレスポンスをパース
        return await response.json();
      } catch (error) {
        console.error("送信処理中のエラー:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // キャッシュをクリア
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.STORE_PROFILE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STORE_STATS],
      });

      toast({
        title: "店舗情報を保存しました",
        description: "変更内容が保存されました。",
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message || "店舗情報の保存に失敗しました",
      });
    },
  });

  const onSubmit = (data: StoreProfile) => {
    // 必須フィールドの確認
    if (!data.recruiter_name) {
      form.setError('recruiter_name', { 
        type: 'manual', 
        message: '採用担当者名を入力してください' 
      });
      
      toast({
        title: "エラー",
        description: "採用担当者名を入力してください",
        variant: "destructive",
      });
      return;
    }

    // 電話番号の確認（少なくとも1つは必要）
    const validPhoneNumbers = data.phone_numbers?.filter(phone => phone && phone.trim() !== '') || [];
    if (validPhoneNumbers.length === 0) {
      toast({
        title: "エラー",
        description: "電話番号を少なくとも1つ入力してください",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // データを整形
      const cleanedData = { ...data };
      
      // 電話番号とメールアドレスの空データをフィルタリング
      cleanedData.phone_numbers = validPhoneNumbers;
      cleanedData.email_addresses = data.email_addresses?.filter(email => email && email.trim() !== '') || [];
      
      console.log("送信前の整形データ:", cleanedData);
      
      // mutate実行
      mutate(cleanedData);
      
      // 送信を開始したことをユーザーに通知
      toast({
        title: "保存中...",
        description: "店舗情報を保存しています",
      });
    } catch (error) {
      console.error("送信前エラー:", error);
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: "データの整形中にエラーが発生しました。もう一度お試しください。",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info className="h-4 w-4" /> 基本情報
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" /> 給与・待遇
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> 連絡先
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> アクセス
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> 安全対策
            </TabsTrigger>
          </TabsList>
          
          {/* 基本情報タブ */}
          <TabsContent value="basic" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-4">基本情報</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="catch_phrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">キャッチコピー</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="キャッチコピーを入力してください（300文字以内）"
                          className="min-h-[100px]"
                          onChange={(e) => {
                            field.onChange(e);
                            setCatchPhraseLength(e.target.value.length);
                          }}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {catchPhraseLength}/300文字
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TOP画像アップロード */}
                <FormField
                  control={form.control}
                  name="top_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">店舗TOP画像（640×640px推奨）</FormLabel>
                      <div className="flex items-center gap-6">
                        {field.value && (
                          <div className="relative h-64 w-64 overflow-hidden rounded-md border">
                            <ThumbnailImage
                              src={field.value}
                              alt="店舗TOP画像"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-3">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor="top-image-upload"
                                className="flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                              >
                                <Image className="mr-2 h-4 w-4" />
                                {field.value
                                  ? "TOP画像を変更"
                                  : "TOP画像をアップロード"}
                                <input
                                  id="top-image-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleTopImageUpload}
                                  disabled={isUploadingTopImage}
                                />
                              </label>
                              {isUploadingTopImage && (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground ml-2" />
                              )}
                            </div>
                          </FormControl>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => form.setValue('top_image', '')}
                            >
                              TOP画像を削除
                            </Button>
                          )}
                          <p className="text-sm text-muted-foreground">
                            店舗TOP画像は640×640pxのサイズで表示されます
                          </p>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 店舗説明 - リッチテキストエディター */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">お仕事の内容</FormLabel>
                      <FormControl>
                        <JobEditor
                          initialValue={field.value}
                          onChange={(content) => {
                            field.onChange(content);
                            setDescriptionLength(content.replace(/<[^>]*>/g, '').length);
                          }}
                          placeholder="お仕事の内容を入力してください（9000文字以内）"
                          maxLength={9000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* 応募条件 */}
            <div className="p-5 border border-purple-200 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">応募条件</h3>
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">応募資格・条件</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="例：18歳以上（高校生不可）、未経験者歓迎、経験者優遇"
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <p className="text-sm text-purple-700 mt-2">※ 年齢制限や必要な資格などを明記してください</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* 給与・待遇タブ */}
          <TabsContent value="salary" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-4">給与情報</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="minimum_guarantee"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">最低給与（円）</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            value={field.value === 0 ? "" : field.value?.toString()}
                            placeholder="例：30000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximum_guarantee"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">最高給与（円）</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            value={field.value === 0 ? "" : field.value?.toString()}
                            placeholder="例：50000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-5 border border-amber-200 bg-amber-50 rounded-lg mt-4">
                  <h3 className="font-semibold text-amber-900 mb-3">時給換算で表示</h3>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="working_time_hours"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="font-medium">勤務時間（時間）</FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              value={field.value === 0 ? "" : field.value?.toString()}
                              placeholder="例：6"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="average_hourly_pay"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="font-medium">平均給与（円）</FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              value={field.value === 0 ? "" : field.value?.toString()}
                              placeholder="例：5000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-sm text-amber-700 mt-2">※ この情報を入力すると「〇時間勤務で平均給与〇円」という形式で表示されます</p>
                  <p className="text-sm text-gray-500">※ 最低給与・最高給与の入力がある場合は従来の表示形式も併用されます</p>
                </div>
                
                {/* 勤務時間帯 */}
                <div className="p-5 border border-blue-200 bg-blue-50 rounded-lg mt-4">
                  <h3 className="font-semibold text-blue-900 mb-3">勤務時間・シフト</h3>
                  <FormField
                    control={form.control}
                    name="working_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">勤務可能時間帯</FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            value={field.value || ''}
                            placeholder="例：12:00～22:00、週末のみ可、自由出勤OK"
                          />
                        </FormControl>
                        <p className="text-sm text-blue-700 mt-2">※ 「早番/遅番」「週〇日〜OK」などシフトに関する情報も記載できます</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              
              {/* 特典・待遇セクションの追加 */}
              <div className="p-5 border border-green-200 bg-green-50 rounded-lg mt-4">
                <h3 className="font-semibold text-green-900 mb-3">特典・待遇</h3>
                <p className="text-sm text-green-700 mb-4">
                  様々な特典・待遇のオプションから選択して、求職者に分かりやすくアピールしましょう。
                </p>
                
                <div className="space-y-6">
                  {/* 面接・入店前 */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">面接・入店前</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(benefitTypes.interview).map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit) || false}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, benefit])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== benefit
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* 働き方自由 */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">働き方自由</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(benefitTypes.workStyle).map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit) || false}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, benefit])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== benefit
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* お給料目安 */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">お給料目安</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(benefitTypes.salary).map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit) || false}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, benefit])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== benefit
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* お給料+α */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">お給料+α</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(benefitTypes.bonus).map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit) || false}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, benefit])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== benefit
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* お店の環境 */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">お店の環境</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(benefitTypes.facility).map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit) || false}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, benefit])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== benefit
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* 採用について */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">採用について</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(benefitTypes.requirements).map((benefit) => (
                        <FormField
                          key={benefit}
                          control={form.control}
                          name="benefits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={benefit}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(benefit) || false}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, benefit])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== benefit
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {benefit}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* 連絡先タブ */}
          <TabsContent value="contact" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-4">連絡先情報</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">住所（任意）</FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="例：東京都渋谷区〇〇町1-2-3 〇〇ビル5F"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recruiter_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">採用担当者名 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="例：採用担当"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="border border-slate-200 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-2" /> 電話番号 <span className="text-red-500 ml-1">*</span>
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhoneNumber}
                      disabled={phoneFields.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" /> 電話番号を追加
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {phoneFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`phone_numbers.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <input
                                  type="text"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="例：03-1234-5678"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhone(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    ※ 少なくとも1つの電話番号が必要です（最大4つまで）
                  </p>
                </div>
                
                <div className="border border-slate-200 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2" /> メールアドレス（任意）
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEmailAddress}
                      disabled={emailFields.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" /> メールアドレスを追加
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {emailFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`email_addresses.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <input
                                  type="email"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="例：example@mail.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmail(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SNS情報セクション */}
                <div className="border border-slate-200 p-4 rounded-md mt-4">
                  <h4 className="font-medium flex items-center mb-4">
                    <MessageSquare className="h-4 w-4 mr-2" /> SNS情報（任意）
                  </h4>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sns_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">LINE ID</FormLabel>
                          <FormControl>
                            <input
                              type="text"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="例：line_id123"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sns_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">LINE URL</FormLabel>
                          <FormControl>
                            <input
                              type="text"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="例：https://line.me/ti/p/～"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sns_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">LINE 案内テキスト</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ''}
                              placeholder="例：LINEで気軽にお問い合わせください！24時間受付中です。"
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* アクセスタブ */}
          <TabsContent value="access" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-4">アクセス情報</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="access_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">最寄り駅・アクセス</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="例：JR渋谷駅西口から徒歩5分、車・バイク通勤OK、送迎あり"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-2">
                        ※ 最寄り駅からの所要時間や交通手段など、詳しいアクセス情報を記載してください
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="application_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">応募時の注意事項</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="例：面接時は私服でお越しください。写真付き身分証明書をご持参ください。"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* 安全対策タブ */}
          <TabsContent value="security" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-4">安全対策・プライバシー配慮</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="security_measures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">セキュリティ対策・プライバシー保護</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="例：防犯カメラ完備、送迎サービスあり、顔出し不要、プライバシー保護対策あり"
                          className="min-h-[150px]"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-2">
                        ※ 店舗のセキュリティ対策やプライバシー保護への取り組みを記載してください
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-8">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="ml-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
}