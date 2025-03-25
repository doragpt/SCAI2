import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeProfileSchema, type StoreProfile, type JobStatus, benefitTypes, benefitCategories, cupSizes } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, Plus, X, Phone, Mail, Link, Building, User, Banknote, Clock, Info, Check, Shield, MapPin, MessageSquare, Award, CheckCircle, Car, Home, Sparkles } from "lucide-react";
import { SpecialOfferEditor } from "./store/SpecialOfferEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import { JobEditor } from "@/components/job-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      special_offers: initialData?.special_offers || [],
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
      requirements: initialData?.requirements || {
        age_min: 18,
        age_max: undefined,
        spec_min: undefined,
        spec_max: undefined,
        cup_size_conditions: [],
        preferred_body_types: [],
        tattoo_acceptance: undefined,
        preferred_hair_colors: [],
        preferred_look_types: [],
        prioritize_titles: false,
        accepts_temporary_workers: true,
        requires_arrival_day_before: false,
        other_conditions: []
      },
      
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
    name: "phone_numbers" as any // typescriptエラー回避のためにany型を使用
  });
  
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: "email_addresses" as any // typescriptエラー回避のためにany型を使用
  });
  
  // カップサイズ条件の配列
  const { fields: cupSizeFields, append: appendCupSize, remove: removeCupSize } = useFieldArray({
    control: form.control,
    name: "requirements.cup_size_conditions"
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
          // 基本情報
          catch_phrase: data.catch_phrase || "",
          description: data.description || "",
          top_image: data.top_image || "",
          special_offers: data.special_offers || [],
          
          // 給与・待遇情報
          benefits: data.benefits || [],
          minimum_guarantee: Number(data.minimum_guarantee) || 0,
          maximum_guarantee: Number(data.maximum_guarantee) || 0,
          working_time_hours: Number(data.working_time_hours) || 0,
          average_hourly_pay: Number(data.average_hourly_pay) || 0,
          status: data.status || "draft",
          requirements: data.requirements,
          working_hours: data.working_hours || "",
          transportation_support: data.transportation_support || false,
          housing_support: data.housing_support || false,
          
          // 連絡先情報（必須項目）
          address: data.address || "",
          recruiter_name: data.recruiter_name || "", // 必須項目
          phone_numbers: data.phone_numbers.filter(p => p.trim() !== ''), // 必須項目、最低1つ
          email_addresses: data.email_addresses?.filter(e => e.trim() !== '') || [],
          
          // SNS情報
          sns_id: data.sns_id || "",
          sns_url: data.sns_url || "",
          sns_text: data.sns_text || "",
          
          // ウェブサイト情報
          pc_website_url: data.pc_website_url || "",
          mobile_website_url: data.mobile_website_url || "",
          
          // 応募要件・アクセス情報
          application_requirements: data.application_requirements || "",
          access_info: data.access_info || "",
          security_measures: data.security_measures || "",
        };
        
        console.log("送信データ:", formattedData);
        
        // フェッチAPIを直接使用して詳細なエラーハンドリングを実装
        // app.tsでは /api/store のエンドポイント設定があり、store.tsでは /profile を処理
        const response = await fetch('/api/store/profile', {
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
            
            {/* 応募条件 - 詳細設定 */}
            <div className="p-5 border border-purple-200 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">応募条件</h3>
              
              {/* 基本的な応募条件テキスト */}
              <FormField
                control={form.control}
                name="application_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">応募資格・条件</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="例：18歳以上（高校生不可）、未経験者歓迎、経験者優遇"
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <p className="text-sm text-purple-700 mt-2">※ 年齢制限や必要な資格などを明記してください</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 詳細なマッチング条件 */}
              <div className="mt-6 bg-white p-4 rounded-md border border-purple-100">
                <h4 className="font-medium text-purple-900 mb-3">マッチング詳細設定</h4>
                <p className="text-sm text-gray-600 mb-4">
                  以下の設定は人材とのマッチング精度を高めるためのものです。
                  設定した条件は求職者には表示されず、AIマッチングの内部処理にのみ使用されます。
                </p>
                
                {/* 年齢範囲 */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">年齢範囲</h5>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="requirements.age_min"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">最小年齢</FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min="18"
                              max="60"
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              value={field.value === undefined ? "" : field.value?.toString()}
                              placeholder="18"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requirements.age_max"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">最大年齢</FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min="18"
                              max="60"
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              value={field.value === undefined ? "" : field.value?.toString()}
                              placeholder="50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* スペック範囲（身長-体重） */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">スペック範囲（身長-体重）</h5>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="requirements.spec_min"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">最小スペック</FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min="80"
                              max="150"
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              value={field.value === undefined ? "" : field.value?.toString()}
                              placeholder="100"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            スリム体型：110以上、普通：100-109、ぽっちゃり：90-99、太め：90未満
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requirements.spec_max"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">最大スペック</FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              min="80"
                              max="150"
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              value={field.value === undefined ? "" : field.value?.toString()}
                              placeholder="130"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* 体型分類 */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.preferred_body_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">希望する体型</FormLabel>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {["スレンダー", "やや細め", "普通", "ややぽっちゃり", "ぽっちゃり", "太め"].map((type: string) => (
                            <FormItem key={type} className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type as any)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), type as any]);
                                    } else {
                                      field.onChange(field.value?.filter(t => t !== type) || []);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal cursor-pointer">{type}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* タトゥー許容レベル */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.tattoo_acceptance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">タトゥー・傷の目立ち具合</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="目立ちにくい">目立ちにくい（ワンポイント・小さいもの）</SelectItem>
                            <SelectItem value="目立つ">目立つ（大きいもの・複数）</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 髪色 */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.preferred_hair_colors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">希望する髪色</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {["黒髪", "暗めの茶髪", "明るめの茶髪", "金髪・インナーカラー・派手髪"].map((color: string) => (
                            <FormItem key={color} className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(color as any)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), color as any]);
                                    } else {
                                      field.onChange(field.value?.filter(c => c !== color) || []);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal cursor-pointer">{color}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 外見スタイル */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.preferred_look_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">希望する外見スタイル</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            "ロリ系・素人系・素朴系・可愛い系",
                            "清楚系",
                            "綺麗系・キレカワ系・モデル系・お姉さん系",
                            "キャバ系・ギャル系",
                            "若妻系",
                            "人妻系",
                            "熟女系",
                            "ぽっちゃり系"
                          ].map((type: string) => (
                            <FormItem key={type} className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type as any)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), type as any]);
                                    } else {
                                      field.onChange(field.value?.filter(t => t !== type) || []);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal cursor-pointer">{type}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 特別優遇設定 */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.prioritize_titles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>芸能人・モデル経験者を優先</FormLabel>
                          <FormDescription>
                            女優、アイドル、モデルなどの経験がある人材を優先的にマッチングします
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 出稼ぎワーカー設定 */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.accepts_temporary_workers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>出稼ぎを受け入れる</FormLabel>
                          <FormDescription>
                            遠方からの出稼ぎ勤務を受け入れる場合はチェックしてください
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* カップサイズ条件 */}
                <div className="mb-6 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium mb-3">カップサイズ条件</h5>
                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <p className="text-xs text-gray-600">
                      カップサイズとスペック条件を組み合わせて設定できます。
                      例：「Dカップ以上で、スペック100以上」など
                    </p>
                  </div>
                  
                  {/* カップサイズ条件のリスト */}
                  {cupSizeFields.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {cupSizeFields.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md bg-white">
                          <div className="flex-1 flex items-center gap-3">
                            <FormField
                              control={form.control}
                              name={`requirements.cup_size_conditions.${index}.cup_size`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-24">
                                        <SelectValue placeholder="カップ" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {cupSizes.map((size) => (
                                        <SelectItem key={size} value={size as string}>{size}カップ</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <span className="text-xs">かつ</span>
                            <FormField
                              control={form.control}
                              name={`requirements.cup_size_conditions.${index}.spec_min`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <input
                                        type="number"
                                        className="flex h-9 w-24 rounded-md border bg-background px-3 py-1 text-sm"
                                        min={80}
                                        max={150}
                                        placeholder="スペック"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <span className="text-xs">以上</span>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCupSize(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 bg-gray-50 rounded-md mb-3">
                      カップサイズ条件が設定されていません
                    </div>
                  )}
                  
                  {/* 追加ボタン */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => appendCupSize({ cup_size: "D", spec_min: 100 })}
                    disabled={cupSizeFields.length >= 5}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    カップサイズ条件を追加
                  </Button>
                </div>

                {/* 前日入り設定 */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="requirements.requires_arrival_day_before"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>前日入りを必須とする</FormLabel>
                          <FormDescription>
                            出稼ぎの場合、勤務開始日の前日に入りを必須とする場合はチェックしてください
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                        <FormLabel className="font-medium">基本給与（円）</FormLabel>
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
                        <FormLabel className="font-medium">上限給与（円）</FormLabel>
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
                  <p className="text-sm text-gray-500">※ 基本給与・上限給与の入力がある場合は従来の表示形式も併用されます</p>
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
            
            {/* 特典・待遇セクション */}
            <div className="p-5 border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg mt-4 relative overflow-hidden">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-purple-100/50 dark:bg-purple-700/10 rounded-full"></div>
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-100/50 dark:bg-purple-700/10 rounded-full"></div>
              
              <div className="relative z-10">
                <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-violet-600 mb-3 text-lg flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  特典・待遇
                </h3>
                <p className="text-sm text-purple-700 mb-4">
                  様々な特典・待遇のオプションから選択して、求職者に分かりやすくアピールしましょう。
                </p>
                
                {/* プレビューカード - 選択した特典を表示 */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-purple-100 dark:border-purple-900/30 mb-6">
                  <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">選択した特典（プレビュー）</h4>
                  
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="flex flex-wrap gap-2">
                      {form.watch("benefits")?.length > 0 ? form.watch("benefits").map((benefit, index) => (
                        <Badge 
                          key={index} 
                          className="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50 font-normal py-2 px-3 rounded-full text-sm"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />{benefit}
                        </Badge>
                      )) : (
                        <div className="w-full p-3 bg-muted rounded-md text-center text-sm text-muted-foreground">
                          特典を選択するとここにプレビューが表示されます
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 特別オファープレビュー */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {form.watch("transportation_support") && (
                      <div className="flex flex-col p-3 rounded-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="p-1.5 bg-amber-200 dark:bg-amber-800/50 rounded-full">
                            <Car className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                          </div>
                          <h5 className="font-bold text-amber-800 dark:text-amber-300 text-xs uppercase">交通費サポート</h5>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400">最寄り駅から送迎あり・交通費全額支給</p>
                      </div>
                    )}
                    
                    {form.watch("housing_support") && (
                      <div className="flex flex-col p-3 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800/30 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="p-1.5 bg-emerald-200 dark:bg-emerald-800/50 rounded-full">
                            <Home className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                          </div>
                          <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs uppercase">寮完備</h5>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">マンション寮完備・家具家電付き</p>
                      </div>
                    )}
                    
                    {/* カスタム特典機能に置き換えのため、給与情報の個別表示は削除 */}
                  </div>
                </div>

                {/* カスタム特典エディター */}
                <div className="mb-6 bg-white/90 p-4 rounded-md border border-purple-100">
                  <h4 className="font-medium flex items-center mb-3 text-purple-800">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    カスタム特典設定（自由に作成）
                  </h4>
                  <FormField
                    control={form.control}
                    name="special_offers"
                    render={({ field }) => {
                      // 正しくフィールド値が設定されていることをコンソールで確認
                      console.log("special_offers フィールド値：", field.value);
                      
                      return (
                        <FormItem>
                          <FormControl>
                            <SpecialOfferEditor 
                              value={field.value || []} 
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription className="text-xs mt-2">
                            特典やキャンペーンを自由に作成できます。タイトル、説明、色、アイコンなどをカスタマイズできます。
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                
                <div className="space-y-6">
                  {/* 面接・入店前 */}
                  <div>
                    <h4 className="font-medium text-purple-800 mb-2">面接・入店前</h4>
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