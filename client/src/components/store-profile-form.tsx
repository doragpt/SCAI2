import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeProfileSchema, type StoreProfile, type JobStatus, benefitTypes, benefitCategories } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, Plus, X, Phone, Mail, Link, Building, User, Banknote, Clock, Info, Check, Shield, MapPin, MessageSquare, HelpCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import { JobEditor } from "@/components/job-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StoreProfileFormProps = {
  initialData?: StoreProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function StoreProfileForm({ initialData, onSuccess, onCancel }: StoreProfileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [catchPhraseLength, setCatchPhraseLength] = useState(initialData?.catch_phrase?.length || 0);
  const [descriptionLength, setDescriptionLength] = useState(initialData?.description?.length || 0);
  const [isUploadingTopImage, setIsUploadingTopImage] = useState(false);
  
  // Initialize form with initial data
  const form = useForm<StoreProfile>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      ...initialData,
      // Basic information
      catch_phrase: initialData?.catch_phrase || "",
      description: initialData?.description || "",
      top_image: initialData?.top_image || "",
      
      // Salary & benefits
      benefits: initialData?.benefits || [],
      minimum_guarantee: initialData?.minimum_guarantee || 0,
      maximum_guarantee: initialData?.maximum_guarantee || 0,
      working_time_hours: initialData?.working_time_hours || 0,
      average_hourly_pay: initialData?.average_hourly_pay || 0,
      status: initialData?.status || "draft",
      working_hours: initialData?.working_hours || "",
      
      // Contact information
      address: initialData?.address || "",
      recruiter_name: initialData?.recruiter_name || "",
      phone_numbers: Array.isArray(initialData?.phone_numbers) && initialData.phone_numbers.length > 0 
        ? initialData.phone_numbers 
        : [''],
      email_addresses: Array.isArray(initialData?.email_addresses) && initialData.email_addresses.length > 0
        ? initialData.email_addresses 
        : [''],
      
      // Website & SNS
      sns_id: initialData?.sns_id || "",
      sns_url: initialData?.sns_url || "",
      sns_text: initialData?.sns_text || "",
      pc_website_url: initialData?.pc_website_url || "",
      mobile_website_url: initialData?.mobile_website_url || "",
      
      // Additional information
      application_requirements: initialData?.application_requirements || "",
      access_info: initialData?.access_info || "",
      security_measures: initialData?.security_measures || "",
      
      // Support information
      transportation_support: initialData?.transportation_support || false,
      housing_support: initialData?.housing_support || false,
    }
  });
  
  // Setup field arrays for repeating fields
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: "phone_numbers"
  });
  
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: "email_addresses"
  });
  
  // Phone number operations
  const addPhoneNumber = () => {
    if (phoneFields.length < 4) {
      appendPhone("");
    }
  };
  
  // Email operations
  const addEmailAddress = () => {
    if (emailFields.length < 4) {
      appendEmail("");
    }
  };
  
  // Top image upload handler
  const handleTopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploadingTopImage(true);
      
      // Prepare FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
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

  // Mutation to save profile data
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: StoreProfile) => {
      try {
        // Format data
        const formattedData = {
          // Basic information
          catch_phrase: data.catch_phrase || "",
          description: data.description || "",
          top_image: data.top_image || "",
          
          // Salary & benefits
          benefits: data.benefits || [],
          minimum_guarantee: Number(data.minimum_guarantee) || 0,
          maximum_guarantee: Number(data.maximum_guarantee) || 0,
          working_time_hours: Number(data.working_time_hours) || 0,
          average_hourly_pay: Number(data.average_hourly_pay) || 0,
          status: data.status || "draft",
          requirements: data.requirements || "",
          working_hours: data.working_hours || "",
          transportation_support: data.transportation_support || false,
          housing_support: data.housing_support || false,
          
          // Contact information
          address: data.address || "",
          recruiter_name: data.recruiter_name || "",
          phone_numbers: data.phone_numbers.filter(p => p.trim() !== ''),
          email_addresses: data.email_addresses?.filter(e => e.trim() !== '') || [],
          
          // Website & SNS
          sns_id: data.sns_id || "",
          sns_url: data.sns_url || "",
          sns_text: data.sns_text || "",
          pc_website_url: data.pc_website_url || "",
          mobile_website_url: data.mobile_website_url || "",
          
          // Additional information
          application_requirements: data.application_requirements || "",
          access_info: data.access_info || "",
          security_measures: data.security_measures || "",
        };
        
        console.log("送信データ:", formattedData);
        
        // Use fetch API directly for detailed error handling
        const response = await fetch('/api/store/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedData),
          credentials: 'include'
        });
        
        console.log("リクエスト結果:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            contentType: response.headers.get('content-type'),
            server: response.headers.get('server')
          }
        });
        
        if (!response.ok) {
          // Handle error response
          const errorText = await response.text();
          console.error("エラーレスポンス:", {
            status: response.status,
            text: errorText
          });
          
          try {
            // Try to parse JSON
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `エラー: ${response.status} ${response.statusText}`);
          } catch (parseError) {
            // If JSON parsing fails, display text as is
            throw new Error(`エラー: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
          }
        }
        
        // Parse JSON response on success
        return await response.json();
      } catch (error) {
        console.error("送信処理中のエラー:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Clear cache
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
    // Check required fields
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

    // Check phone numbers (at least one is required)
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
      // Format data
      const cleanedData = { ...data };
      
      // Filter out empty phone numbers and email addresses
      cleanedData.phone_numbers = validPhoneNumbers;
      cleanedData.email_addresses = data.email_addresses?.filter(email => email && email.trim() !== '') || [];
      
      console.log("送信前の整形データ:", cleanedData);
      
      // Execute mutation
      mutate(cleanedData);
      
      // Notify user that submission has started
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Basic Store Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Building className="h-5 w-5 mr-2" /> 
                  店舗基本情報
                </CardTitle>
                <CardDescription>
                  店舗の基本的な情報を入力してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Image */}
                <FormField
                  control={form.control}
                  name="top_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium flex items-center">
                        店舗TOP画像
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">640×640pxのサイズで表示されます。店舗の外観やロゴなど、訴求力の高い画像を選びましょう。</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <div className="flex items-start flex-col sm:flex-row gap-4">
                        {field.value ? (
                          <div className="relative h-40 w-40 overflow-hidden rounded-md border">
                            <ThumbnailImage
                              src={field.value}
                              alt="店舗TOP画像"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-40 w-40 bg-muted rounded-md border">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-3 justify-center">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor="top-image-upload"
                                className="flex h-10 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {field.value ? "画像を変更" : "画像をアップロード"}
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
                              <X className="h-4 w-4 mr-2" />
                              画像を削除
                            </Button>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Catch Phrase */}
                <FormField
                  control={form.control}
                  name="catch_phrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">キャッチコピー</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="魅力的なキャッチコピーを入力してください（300文字以内）"
                          className="min-h-[80px]"
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

                {/* Store Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">店舗紹介文</FormLabel>
                      <FormControl>
                        <div className="min-h-[200px] border rounded-md">
                          <JobEditor
                            initialValue={field.value}
                            onChange={(content) => {
                              field.onChange(content);
                              setDescriptionLength(content.length);
                            }}
                            placeholder="店舗の魅力や特徴、働く環境について詳しく記入してください"
                          />
                        </div>
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {descriptionLength}/9000文字
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Salary & Benefits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Banknote className="h-5 w-5 mr-2" /> 
                  給与・待遇情報
                </CardTitle>
                <CardDescription>
                  給与や待遇に関する情報を入力してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Salary Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimum_guarantee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">最低日給保証</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full"
                              min={0}
                            />
                            <span className="ml-2">円</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          最低いくら稼げるかを入力
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximum_guarantee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">最高日給目安</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full"
                              min={0}
                            />
                            <span className="ml-2">円</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          平均的な最高額を入力
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hourly Rate Calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="working_time_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">勤務時間（時間）</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              placeholder="8"
                              className="w-full"
                              min={0}
                              max={24}
                            />
                            <span className="ml-2">時間</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          平均的な1日の勤務時間
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="average_hourly_pay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">平均時給</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full"
                              min={0}
                            />
                            <span className="ml-2">円</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          平均的な時給目安
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Working Hours */}
                <FormField
                  control={form.control}
                  name="working_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">勤務時間</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="例: 12:00～翌0:00（実働8時間）" 
                        />
                      </FormControl>
                      <FormDescription>
                        営業時間や実際の勤務時間帯を入力
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Benefits */}
                <FormField
                  control={form.control}
                  name="benefits"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="font-medium">待遇・福利厚生</FormLabel>
                        <FormDescription>
                          該当する項目をすべてチェックしてください
                        </FormDescription>
                      </div>
                      
                      {/* Display benefits by category */}
                      <div className="space-y-4">
                        {Object.entries(benefitCategories).map(([category, title]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-medium">{title}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {benefitTypes[category as keyof typeof benefitTypes].map((benefit) => (
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
                                            checked={field.value?.includes(benefit)}
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
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                          {benefit}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Support Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transportation_support"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            交通費サポートあり
                          </FormLabel>
                          <FormDescription>
                            交通費の支給や補助がある場合にチェック
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="housing_support"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            住居サポートあり
                          </FormLabel>
                          <FormDescription>
                            寮や住居の提供、家賃補助がある場合にチェック
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Info & Additional Details */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Phone className="h-5 w-5 mr-2" /> 
                  連絡先情報
                </CardTitle>
                <CardDescription>
                  応募者との連絡に使用する情報
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recruiter Name */}
                <FormField
                  control={form.control}
                  name="recruiter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium flex items-center">
                        採用担当者名
                        <Badge variant="destructive" className="ml-2 text-[10px]">必須</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="採用担当者の名前" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Numbers */}
                <div className="space-y-2">
                  <FormLabel className="font-medium flex items-center">
                    電話番号
                    <Badge variant="destructive" className="ml-2 text-[10px]">必須</Badge>
                  </FormLabel>
                  <FormDescription>
                    最低1つの電話番号が必要です（最大4つまで）
                  </FormDescription>
                  
                  {phoneFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`phone_numbers.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} placeholder="例: 090-1234-5678" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {phoneFields.length > 1 && (
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
                  
                  {phoneFields.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhoneNumber}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      電話番号を追加
                    </Button>
                  )}
                </div>

                {/* Email Addresses */}
                <div className="space-y-2">
                  <FormLabel className="font-medium">メールアドレス</FormLabel>
                  <FormDescription>
                    メールアドレスを入力してください（最大4つまで）
                  </FormDescription>
                  
                  {emailFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`email_addresses.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} placeholder="例: contact@example.com" type="email" />
                              </div>
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
                          onClick={() => removeEmail(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {emailFields.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEmailAddress}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      メールアドレスを追加
                    </Button>
                  )}
                </div>

                {/* Websites */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pc_website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">PCサイトURL</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Link className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="例: https://www.example.com" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobile_website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">モバイルサイトURL</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Link className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="例: https://m.example.com" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <MapPin className="h-5 w-5 mr-2" /> 
                  所在地・アクセス
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">所在地</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="例: 東京都新宿区歌舞伎町1-1-1 〇〇ビル5F"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="access_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">アクセス情報</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="例: JR新宿駅東口から徒歩5分"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Application Requirements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" /> 
                  応募資格・メッセージ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="application_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">応募資格・メッセージ</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="応募に必要な条件や、応募者へのメッセージを記入してください"
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Security Measures */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Shield className="h-5 w-5 mr-2" /> 
                  安全対策
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="security_measures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">セキュリティ対策・プライバシー配慮</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="プライバシー保護や安全対策について記入してください"
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                保存する
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}