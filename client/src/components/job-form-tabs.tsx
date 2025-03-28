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
import { Loader2, Upload, Image, Plus, X, Phone, Mail, Link, Building, User, Banknote, Clock, Info, Check, Shield, MapPin, MessageSquare, Award, CheckCircle, Car, Home, Sparkles, ImageIcon, Briefcase } from "lucide-react";
import { SpecialOfferEditor } from "./store/SpecialOfferEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { apiRequest } from "@/lib/queryClient";
import { ThumbnailImage } from "@/components/blog/thumbnail-image";
import { JobEditor } from "@/components/job-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataUtils, DEFAULT_REQUIREMENTS } from "@shared/utils/dataTypeUtils";
import { PhotoGalleryFormTab } from "./store/PhotoGalleryFormTab";

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
      gallery_photos: initialData?.gallery_photos || [],
      
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
      privacy_measures: initialData?.privacy_measures || "",
      commitment: initialData?.commitment || "",
      
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
      console.log("ミューテーション開始 - データ受信:", { 
        dataKeys: Object.keys(data),
        hasRequirements: !!data.requirements,
        requirementsType: typeof data.requirements,
        hasSpecialOffers: Array.isArray(data.special_offers),
        specialOffersCount: Array.isArray(data.special_offers) ? data.special_offers.length : 0
      });
      
      try {
        // design_settings フィールドがあるか確認
        const hasDesignSettings = data.design_settings !== undefined;
        console.log("design_settings確認:", { 
          hasDesignSettings, 
          type: typeof data.design_settings, 
          value: data.design_settings
        });
        
        // データを整形
        const formattedData = {
          // 基本情報
          catch_phrase: data.catch_phrase || "",
          description: data.description || "",
          top_image: data.top_image || "",
          special_offers: Array.isArray(data.special_offers) ? data.special_offers : [],
          
          // 給与・待遇情報
          benefits: data.benefits || [],
          minimum_guarantee: Number(data.minimum_guarantee) || 0,
          maximum_guarantee: Number(data.maximum_guarantee) || 0,
          working_time_hours: Number(data.working_time_hours) || 0,
          average_hourly_pay: Number(data.average_hourly_pay) || 0,
          status: data.status || "draft",
          
          // 応募条件の整形
          requirements: typeof data.requirements === 'object' && data.requirements
            ? {
                ...data.requirements,
                // cup_size_conditionsが配列であることを保証
                cup_size_conditions: Array.isArray(data.requirements?.cup_size_conditions) 
                  ? data.requirements?.cup_size_conditions 
                  : []
              }
            : {
                accepts_temporary_workers: false,
                requires_arrival_day_before: false,
                prioritize_titles: false,
                other_conditions: [],
                cup_size_conditions: []
              },
              
          working_hours: data.working_hours || "",
          transportation_support: data.transportation_support || false,
          housing_support: data.housing_support || false,
          
          // 連絡先情報（必須項目）
          address: data.address || "",
          recruiter_name: data.recruiter_name || "", // 必須項目
          phone_numbers: data.phone_numbers.filter(p => p && p.trim() !== ''), // 必須項目、最低1つ
          email_addresses: data.email_addresses?.filter(e => e && e.trim() !== '') || [],
          
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
          privacy_measures: data.privacy_measures || "",
          commitment: data.commitment || "",
          
          // 店舗写真ギャラリー
          gallery_photos: Array.isArray(data.gallery_photos) ? data.gallery_photos : [],
          
          // デザイン設定がある場合はそれも含める
          // design_settingsの処理
          design_settings: data.design_settings ? data.design_settings : undefined,
        };
        
        console.log("送信データ:", { 
          dataKeys: Object.keys(formattedData),
          specialOffersType: typeof formattedData.special_offers,
          specialOffersLength: Array.isArray(formattedData.special_offers) ? formattedData.special_offers.length : 'not array',
          requirementsType: typeof formattedData.requirements,
          designSettingsIncluded: formattedData.design_settings !== undefined
        });
        
        // リクエスト送信前のデバッグ
        console.log("apiRequest実行準備完了:", { 
          url: "/api/store/profile", 
          method: "PATCH",
          timestamp: new Date().toISOString()
        });
        
        try {
          // apiRequest関数を使用してリクエストを送信
          // 重要: 正しいAPIパスを使用（/api/store/profileではなく/api/storeにマウントされたrouterの/profile）
          const apiEndpoint = "/api/store/profile";
          console.log("店舗プロフィール更新 - APIリクエスト送信開始:", {
            endpoint: apiEndpoint,
            method: "PATCH",
            timestamp: new Date().toISOString()
          });
          
          const result = await apiRequest("PATCH", apiEndpoint, formattedData);
          console.log("店舗プロフィール更新 - リクエスト成功:", {
            result,
            resultType: typeof result,
            hasSuccess: 'success' in result,
            successValue: result.success,
            timestamp: new Date().toISOString()
          });
          
          // successフラグを明示的に確認し、falseの場合はエラーをスロー
          if (result && result.success === false) {
            throw new Error(result.message || "店舗プロフィールの更新に失敗しました");
          }
          
          return result;
        } catch (error) {
          console.error("apiRequest処理中のエラー:", { 
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : 'no stack',
            timestamp: new Date().toISOString()
          });
          throw error;
        }
      } catch (error) {
        console.error("送信処理中のエラー:", { 
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : 'no stack',
          timestamp: new Date().toISOString() 
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("店舗プロフィール更新 - ミューテーション成功:", {
        data,
        hasSuccess: data && 'success' in data,
        successValue: data && data.success,
        hasOnSuccessCallback: !!onSuccess,
        timestamp: new Date().toISOString()
      });
      
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

      // 親コンポーネントのコールバックを実行（ダイアログを閉じるなど）
      if (onSuccess) {
        console.log("店舗プロフィール更新 - 親コンポーネントのonSuccessコールバックを呼び出します");
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

  /**
   * フォームデータを送信前に整形する関数
   * データベースのカラム型（JSONB/TEXT）と合わせて適切な型に変換する
   */
  const prepareFormData = (data: StoreProfile): StoreProfile => {
    // 処理前にデータ構造をログに出力
    dataUtils.logDataStructure(data, "送信前の元データ");
    
    // データのコピーを作成
    const cleanedData = { ...data };
    
    // 1. special_offers - JSONB型カラム: 配列にする
    // データベースカラムの型に合わせて、確実に配列になるように処理する
    try {
      // 配列の検証と正規化を行う関数
      const normalizeSpecialOffers = (offersArray: any[]): any[] => {
        if (!Array.isArray(offersArray)) return [];
        
        // 無効な要素をフィルタリングし、有効な要素のみを正規化
        return offersArray
          .filter(offer => offer && typeof offer === 'object')
          .map(offer => {
            // 基本的な構造の確認と標準化
            const normalizedOffer = {
              id: typeof offer.id === 'string' && offer.id.trim() !== '' 
                ? offer.id.trim() 
                : `offer-${Math.random().toString(36).substring(2, 9)}`,
              title: typeof offer.title === 'string' ? offer.title : "特別オファー",
              description: typeof offer.description === 'string' ? offer.description : "",
              // 重要: typeフィールドは必ず"bonus"にする
              type: "bonus",
              icon: typeof offer.icon === 'string' ? offer.icon : "Award",
              backgroundColor: typeof offer.backgroundColor === 'string' ? offer.backgroundColor : "#fff9fa",
              textColor: typeof offer.textColor === 'string' ? offer.textColor : "#333333",
              isActive: typeof offer.isActive === 'boolean' ? offer.isActive : true,
              isLimited: typeof offer.isLimited === 'boolean' ? offer.isLimited : false,
              order: typeof offer.order === 'number' ? offer.order : 0,
              targetAudience: Array.isArray(offer.targetAudience) ? offer.targetAudience : []
            };
            
            return normalizedOffer;
          });
      };
      
      // データ型に基づいた処理
      if (Array.isArray(cleanedData.special_offers)) {
        console.log("special_offers フィールド値タイプ:", typeof cleanedData.special_offers);
        cleanedData.special_offers = normalizeSpecialOffers(cleanedData.special_offers);
      } 
      else if (typeof cleanedData.special_offers === 'string') {
        // 文字列の場合は、パースして配列に変換
        try {
          const strValue = String(cleanedData.special_offers);
          console.log("special_offers は文字列です:", strValue.substring(0, Math.min(50, strValue.length)));
          const parsedOffers = JSON.parse(cleanedData.special_offers);
          cleanedData.special_offers = normalizeSpecialOffers(Array.isArray(parsedOffers) ? parsedOffers : []);
        } catch (error) {
          console.error("special_offers文字列のパースエラー:", error);
          cleanedData.special_offers = [];
        }
      } else {
        // 他の型の場合は空配列に設定
        console.log("special_offers は配列でも文字列でもありません:", typeof cleanedData.special_offers);
        cleanedData.special_offers = [];
      }
      
      // 最終結果のログ
      console.log("正規化後の special_offers:", {
        isArray: Array.isArray(cleanedData.special_offers),
        length: Array.isArray(cleanedData.special_offers) ? cleanedData.special_offers.length : 0,
        sample: Array.isArray(cleanedData.special_offers) && cleanedData.special_offers.length > 0 
          ? JSON.stringify(cleanedData.special_offers[0]).slice(0, 100) 
          : "empty array"
      });
    } catch (error) {
      console.error("special_offers検証中のエラー:", error);
      cleanedData.special_offers = [];
    }
    
    // 2. gallery_photos - JSONB型カラム: 配列にする
    try {
      if (typeof cleanedData.gallery_photos === 'string') {
        // 文字列の場合、パースを試みる
        try {
          const parsedGallery = JSON.parse(cleanedData.gallery_photos);
          if (Array.isArray(parsedGallery)) {
            cleanedData.gallery_photos = parsedGallery;
          } else {
            cleanedData.gallery_photos = [];
          }
        } catch (e) {
          cleanedData.gallery_photos = [];
        }
      } else if (!Array.isArray(cleanedData.gallery_photos)) {
        // 配列でない場合は空配列にする
        cleanedData.gallery_photos = [];
      }
    } catch (error) {
      console.error("gallery_photos検証中のエラー:", error);
      cleanedData.gallery_photos = [];
    }
    
    // 3. requirements - JSONB型カラム: オブジェクトにする
    try {
      if (typeof cleanedData.requirements === 'string') {
        // 文字列の場合はJSONとしてパース
        try {
          const parsedReq = JSON.parse(cleanedData.requirements);
          if (typeof parsedReq === 'object' && parsedReq !== null) {
            cleanedData.requirements = {
              ...DEFAULT_REQUIREMENTS,
              ...parsedReq,
              // cup_size_conditionsが配列であることを保証
              cup_size_conditions: Array.isArray(parsedReq.cup_size_conditions) 
                ? parsedReq.cup_size_conditions 
                : []
            };
          } else {
            cleanedData.requirements = { ...DEFAULT_REQUIREMENTS };
          }
        } catch (e) {
          // パースに失敗した場合はデフォルト値を設定
          cleanedData.requirements = { ...DEFAULT_REQUIREMENTS };
        }
      } else if (cleanedData.requirements && typeof cleanedData.requirements === 'object') {
        // オブジェクトの場合、必須フィールドを確保
        cleanedData.requirements = {
          ...DEFAULT_REQUIREMENTS,
          ...cleanedData.requirements,
          // cup_size_conditionsが配列であることを保証
          cup_size_conditions: Array.isArray(cleanedData.requirements.cup_size_conditions) 
            ? cleanedData.requirements.cup_size_conditions 
            : []
        };
      } else {
        // その他の型の場合はデフォルト値を設定
        cleanedData.requirements = { ...DEFAULT_REQUIREMENTS };
      }
    } catch (error) {
      console.error("requirements検証中のエラー:", error);
      cleanedData.requirements = { ...DEFAULT_REQUIREMENTS };
    }
    
    // 処理後のデータ構造をログに出力
    dataUtils.logDataStructure(cleanedData, "送信前の処理済みデータ");
    
    return cleanedData;
  };

  const onSubmit = async (data: StoreProfile) => {
    console.log("フォーム送信が開始されました", { 
      formValid: form.formState.isValid,
      timestamp: new Date().toISOString()
    });
    
    // データを適切な型に変換
    const cleanedData = prepareFormData(data);
    
    // フォームのエラーをすべて出力
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("フォームにエラーがあります:", form.formState.errors);
    }
    
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
      console.error("採用担当者名が入力されていません");
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
      console.log("フォーム検証通過 - 送信処理開始", {
        timestamp: new Date().toISOString()
      });
      
      // 電話番号とメールアドレスの空データをフィルタリング
      cleanedData.phone_numbers = validPhoneNumbers;
      cleanedData.email_addresses = data.email_addresses?.filter(email => email && email.trim() !== '') || [];
      
      // 簡易データ構造ログを出力
      console.log("送信前の整形データ:", {
        dataKeys: Object.keys(cleanedData),
        specialOffersType: typeof cleanedData.special_offers,
        requirementsType: typeof cleanedData.requirements,
        galleryPhotosIsArray: Array.isArray(cleanedData.gallery_photos),
        timestamp: new Date().toISOString() 
      });
      
      // 特別オファーのデータ構造を詳細にログ出力
      if (cleanedData.special_offers) {
        if (typeof cleanedData.special_offers === 'string') {
          try {
            const parsedOffers = JSON.parse(cleanedData.special_offers);
            if (Array.isArray(parsedOffers)) {
              console.log("送信前の各特別オファーの詳細(文字列型):", parsedOffers.map((offer: any) => ({
                id: offer.id,
                type: offer.type,
                title: offer.title,
                targetAudience: offer.targetAudience,
                hasTargetAudience: Array.isArray(offer.targetAudience),
                targetAudienceType: typeof offer.targetAudience,
                keys: Object.keys(offer)
              })));
            }
          } catch (e) {
            console.error("特別オファーの詳細ログ出力時にパースエラー:", e);
          }
        } else if (Array.isArray(cleanedData.special_offers)) {
          // 配列の場合は直接マッピング
          console.log("送信前の各特別オファーの詳細(配列型):", cleanedData.special_offers.map((offer: any) => ({
            id: offer.id,
            type: offer.type,
            title: offer.title,
            targetAudience: offer.targetAudience,
            hasTargetAudience: Array.isArray(offer.targetAudience),
            targetAudienceType: typeof offer.targetAudience,
            keys: Object.keys(offer)
          })));
        }
      }
      
      // 送信を開始したことをユーザーに通知
      toast({
        title: "保存中...",
        description: "店舗情報を保存しています",
      });
      
      // API パスを明示的に確認
      const apiPath = '/api/store/profile';
      console.log("店舗プロフィール更新 - API呼び出し情報:", {
        path: apiPath,
        method: "PATCH", 
        formDataKeys: Object.keys(cleanedData),
        hasRequiredFields: {
          recruiter_name: !!cleanedData.recruiter_name,
          phone_numbers: Array.isArray(cleanedData.phone_numbers) && cleanedData.phone_numbers.length > 0,
        },
        timestamp: new Date().toISOString()
      });
      
      // 必須項目の再検証
      if (!cleanedData.recruiter_name || !cleanedData.phone_numbers || !cleanedData.phone_numbers.length) {
        console.error("必須項目が不足しています（最終チェック）:", {
          recruiter_name: cleanedData.recruiter_name,
          phone_numbers: cleanedData.phone_numbers
        });
        
        toast({
          variant: "destructive",
          title: "必須項目エラー",
          description: "採用担当者名と電話番号を入力してください",
        });
        return;
      }
      
      // JSONデータをコンソールに出力（トラブルシューティング用）
      const jsonData = JSON.stringify(cleanedData);
      console.log("送信する実際のJSONデータ:", jsonData);
      
      // fetchを使って直接APIを呼び出す
      try {
        console.log("直接fetchによるAPIリクエスト試行");
        
        // 直接fetch呼び出し
        const response = await fetch(apiPath, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: jsonData,
          credentials: 'include',
          // Replicが問題を起こす可能性があるため、キャッシュをオフに
          cache: 'no-store' 
        });
        
        console.log("直接fetchレスポンス受信:", {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          timestamp: new Date().toISOString(),
          headers: Object.fromEntries(Array.from(response.headers.entries()))
        });
        
        // レスポンスボディの取得
        const result = await response.text();
        let parsedResult;
        
        try {
          // JSONとして解析を試みる
          parsedResult = JSON.parse(result);
          console.log("直接fetch結果（JSON）:", {
            status: response.status,
            ok: response.ok,
            result: parsedResult,
            timestamp: new Date().toISOString()
          });
        } catch (jsonError) {
          // JSON解析に失敗した場合はテキストとして扱う
          console.error("JSONの解析に失敗:", { 
            textResult: result, 
            error: jsonError 
          });
          parsedResult = { success: false, message: "サーバーからの応答を解析できませんでした" };
        }
        
        // 成功したらキャッシュを更新してコールバックを呼び出す
        if (response.ok) {
          console.log("直接fetchによる保存成功");
          
          // キャッシュを強制的に無効化
          console.log("キャッシュを無効化しています");
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
          
          // ダイアログを閉じるコールバックを呼び出す
          if (onSuccess) {
            console.log("成功時のコールバックを呼び出します");
            window.setTimeout(() => {
              onSuccess();
            }, 100);
          }
          
          return; // 成功したので以降の処理は不要
        } else {
          // エラーレスポンスの処理
          console.error("直接fetchエラー:", parsedResult);
          toast({
            variant: "destructive",
            title: "保存に失敗しました",
            description: parsedResult?.message || `エラー: ${response.status} ${response.statusText}`,
          });
        }
      } catch (directFetchError) {
        console.error("直接fetch中の例外:", directFetchError);
        toast({
          variant: "destructive",
          title: "通信エラー",
          description: directFetchError instanceof Error ? directFetchError.message : "サーバーとの通信中にエラーが発生しました",
        });
        
        // エラーがあってもmutateを試す
      }
      
      // fetchが失敗した場合のバックアップとしてmutateを実行
      console.log("mutate実行開始");
      mutate(cleanedData, {
        onSuccess: (result) => {
          console.log("mutate直接コールバック - 保存成功:", {
            result,
            hasSuccessCallback: !!onSuccess,
            timestamp: new Date().toISOString()
          });
          
          // 成功時のコールバックを明示的に呼び出し
          if (onSuccess) {
            console.log("親コンポーネントのonSuccessコールバックを直接呼び出します");
            onSuccess();
          }
        },
        onError: (error) => {
          console.error("mutate直接コールバック - エラー:", {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          });
          
          toast({
            variant: "destructive",
            title: "保存に失敗しました",
            description: error instanceof Error ? error.message : "不明なエラーが発生しました",
          });
        }
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

  // フォーム送信を直接処理する関数（form.handleSubmitを使わない）
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトの送信動作を防止
    
    console.log("送信ボタンがクリックされました - 直接ハンドラ", {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      timestamp: new Date().toISOString()
    });
    
    // フォームのエラーをリセット
    form.clearErrors();
    
    // フォームの現在の値を取得
    const formData = form.getValues();
    console.log("フォームデータ取得:", {
      formDataKeys: Object.keys(formData),
      hasRecruiterName: !!formData.recruiter_name,
      phoneNumbersLength: formData.phone_numbers?.length
    });
    
    // 必須項目の検証
    let hasErrors = false;
    
    // 採用担当者名の検証
    if (!formData.recruiter_name) {
      form.setError('recruiter_name', { 
        type: 'manual', 
        message: '採用担当者名を入力してください' 
      });
      hasErrors = true;
      console.error("採用担当者名が入力されていません");
    }
    
    // 電話番号の検証
    const validPhoneNumbers = formData.phone_numbers?.filter(phone => phone && phone.trim() !== '') || [];
    if (validPhoneNumbers.length === 0) {
      form.setError('phone_numbers.0', {
        type: 'manual',
        message: '電話番号を少なくとも1つ入力してください'
      });
      hasErrors = true;
      console.error("有効な電話番号がありません");
    }
    
    if (hasErrors) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください",
        variant: "destructive",
      });
      return;
    }
    
    // 検証に成功したら、処理を続行
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("フォーム送信中にエラーが発生しました:", error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-6 mb-6">
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
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> 写真ギャラリー
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
                      // 文字列型のフィールドをパースしてコンポーネントに配列として渡す
                      console.log("special_offers フィールド値タイプ:", typeof field.value);
                      
                      let offersArray = [];
                      try {
                        if (typeof field.value === 'string') {
                          // 文字列の場合はパースを試みる
                          offersArray = JSON.parse(field.value);
                          if (!Array.isArray(offersArray)) {
                            console.warn("特別オファーのパース結果が配列ではありません", typeof offersArray);
                            offersArray = [];
                          }
                        } else if (Array.isArray(field.value)) {
                          // すでに配列の場合はそのまま使用
                          offersArray = field.value;
                        } else {
                          console.warn("特別オファーが配列でも文字列でもありません", typeof field.value);
                          offersArray = [];
                        }
                      } catch (error) {
                        console.error("特別オファーのパースエラー", error);
                        offersArray = [];
                      }
                      
                      // カスタムonChangeハンドラ - 文字列として保存
                      const handleOffersChange = (newOffersJson: string) => {
                        try {
                          // すでに文字列なのでそのまま保存
                          field.onChange(newOffersJson);
                        } catch (error) {
                          console.error("特別オファーの文字列化エラー", error);
                          field.onChange("[]");
                        }
                      };
                      
                      return (
                        <FormItem>
                          <FormControl>
                            <SpecialOfferEditor 
                              value={typeof field.value === 'string' ? field.value : JSON.stringify(offersArray)} 
                              onChange={handleOffersChange}
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
                  name="application_notes"
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
                      <FormLabel className="font-medium">安全への取り組み</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="例：防犯カメラ完備、24時間警備スタッフ常駐、送迎サービスあり"
                          className="min-h-[150px]"
                        />
                      </FormControl>
                      <FormDescription>
                        店舗の安全対策について説明してください。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="privacy_measures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">プライバシー保護</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="例：顔出し不要、SNSやネット上での情報管理対策、個人情報の厳重管理"
                          className="min-h-[150px]"
                        />
                      </FormControl>
                      <FormDescription>
                        プライバシー保護のための対策について説明してください。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="commitment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">コミットメント</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="例：当店は女性スタッフの安全と働きやすさを最優先に考え、常に環境改善に取り組んでいます。"
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
          
          {/* 写真ギャラリータブ */}
          <TabsContent value="gallery" className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-4">店舗写真ギャラリー</h3>
              <p className="text-sm text-gray-600 mb-4">
                お店の内装・設備・待機所などの写真を登録して、求職者に魅力をアピールしましょう。
                写真は各カテゴリごとに分類されます。
              </p>
              <FormField
                control={form.control}
                name="gallery_photos"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PhotoGalleryFormTab
                        photos={field.value || []}
                        onChange={(newPhotos) => {
                          field.onChange(newPhotos);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            type="button" // submitからbuttonに変更して明示的にclickイベントを処理
            disabled={isPending}
            className="ml-auto"
            onClick={(e) => {
              e.preventDefault();
              console.log("保存ボタンが直接クリックされました");
              handleFormSubmit(e);
            }}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
}