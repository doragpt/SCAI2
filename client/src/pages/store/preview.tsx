import React, { useState, useEffect, useRef } from 'react';
import { HtmlContent } from '@/components/html-content';
import { type StoreProfile, type DesignSettings, type SectionSettings, type DesignSection } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Link as RouterLink } from 'wouter';
import { PhotoGalleryDisplay } from '@/components/store/PhotoGalleryDisplay';
import { SpecialOffersDisplay } from '@/components/store/SpecialOffersDisplay';
import { SNSLinksDisplay } from '@/components/store/SNSLinksDisplay';
import { 
  Building2, Clock, MapPin, Phone, Mail, BadgeCheck, 
  Image, User, DollarSign, Info, ArrowLeft,
  Monitor, Smartphone, FileText, BookOpen, File,
  Gift, MessageSquare, PartyPopper, Sparkles,
  Share2, Link as LinkIcon, Video, Twitter as TwitterIcon, Instagram as InstagramIcon
} from 'lucide-react';
import { 
  type SpecialOffer, 
  type GalleryPhoto 
} from '@shared/schema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';

/**
 * デザイン設定を反映した店舗ページのプレビューコンポーネント
 * デザイン管理機能で設定されたスタイルやセクションの表示/非表示、順序を反映します
 */
// デバッグ用関数（コンポーネント外で定義して一貫して使用）
const DEBUG_MODE = true; // デバッグログを有効/無効にするフラグ
function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`[Preview] ${message}`, data);
    } else {
      console.log(`[Preview] ${message}`);
    }
  }
}

export default function StorePreview() {
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const [currentDesignSettings, setCurrentDesignSettings] = useState<DesignSettings | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // 店舗データを取得
  const { data: profile, isLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      try {
        debugLog('店舗プロフィールを取得しています...');
        const response = await apiRequest("GET", "/store/profile");
        debugLog('店舗プロフィール取得成功:', response);
        return response as StoreProfile;
      } catch (error) {
        debugLog('店舗プロフィール取得エラー:', error);
        throw error;
      }
    }
  });

  // ページにデザイン設定を適用
  // デザイン設定を適用する関数
  const applyDesignSettings = (settings: DesignSettings) => {
    if (settings && mainContentRef.current) {
      // グローバル設定を適用
      const global = settings.globalSettings;
      const root = document.documentElement;
      root.style.setProperty('--primary', global.mainColor);
      root.style.setProperty('--secondary', global.secondaryColor);
      root.style.setProperty('--accent', global.accentColor);
      root.style.setProperty('--background', global.backgroundColor);
      root.style.setProperty('--border-radius', `${global.borderRadius}px`);
      
      // フォントファミリーを設定
      document.body.style.fontFamily = global.fontFamily;
      
      debugLog('デザイン設定を適用しました', {
        time: new Date().toISOString(),
        mainColor: global.mainColor
      });
    }
  };

  // プロフィールのデザイン設定を適用
  useEffect(() => {
    if (profile?.design_settings) {
      applyDesignSettings(profile.design_settings);
    }
  }, [profile?.design_settings]);
  
  // postMessageリスナーの設定（リアルタイムプレビュー用）
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const timestamp = new Date().toISOString();
      debugLog('メッセージ受信', { 
        type: event.data?.type, 
        hasSettings: !!event.data?.settings,
        origin: event.origin,
        time: timestamp
      });
      
      // DESIGN_SETTINGSとUPDATE_DESIGNの両方に対応
      if (event.data?.type === 'UPDATE_DESIGN' || event.data?.type === 'DESIGN_SETTINGS') {
        debugLog('デザイン設定更新メッセージを受信', {
          type: event.data.type,
          timestamp: event.data.timestamp || timestamp,
          hasSettings: !!event.data.settings,
          sectionsCount: event.data.settings?.sections?.length,
          globalSettings: !!event.data.settings?.globalSettings
        });
        
        if (event.data.settings) {
          try {
            // セクションIDリストをログ（型付き）
            debugLog('受信したセクションID', 
              event.data.settings.sections.map((s: { id: string; visible: boolean; order: number }) => ({ 
                id: s.id, 
                visible: s.visible, 
                order: s.order 
              }))
            );
            
            // セクションの整合性を確認（catchphraseとdescriptionの関係を特に注意）
            const hasDescription = event.data.settings.sections.some((s: { id: string }) => s.id === 'description');
            const hasCatchphrase = event.data.settings.sections.some((s: { id: string }) => s.id === 'catchphrase');
            
            if (hasDescription && !hasCatchphrase) {
              debugLog('修正: descriptionセクションがあるがcatchphraseがない', {
                fix: 'descriptionをcatchphraseに変換します'
              });
              
              // descriptionをcatchphraseに変換
              event.data.settings.sections = event.data.settings.sections.map((s: { id: string; title?: string }) => {
                if (s.id === 'description') {
                  return { ...s, id: 'catchphrase', title: 'キャッチコピー・仕事内容' };
                }
                return s;
              });
            }
            
            // 設定を適用
            setCurrentDesignSettings(event.data.settings);
            applyDesignSettings(event.data.settings);
            
            debugLog('デザイン設定を適用しました');
          } catch (error) {
            debugLog('デザイン設定の適用に失敗しました:', error);
          }
        } else {
          debugLog('デザイン設定が見つかりません:', event.data);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    debugLog('メッセージリスナーを登録しました', { time: new Date().toISOString() });
    
    // 親ウィンドウに準備完了を通知
    try {
      window.parent.postMessage({ type: 'PREVIEW_READY', timestamp: new Date().toISOString() }, '*');
      debugLog('親ウィンドウに準備完了を通知しました');
    } catch (error) {
      debugLog('親ウィンドウへの通知に失敗しました:', error);
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  // プロフィールが存在しない場合
  if (!profile) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">プロフィールが見つかりません</h2>
        <p>店舗プロフィールが設定されていません。まずはプロフィールを作成してください。</p>
      </div>
    );
  }

  // デザイン設定を取得、リアルタイム更新分がある場合はそちらを優先、なければプロファイルから、それもなければデフォルト設定を使用
  const defaultSettings = getDefaultDesignSettings();
  
  const designSettings = currentDesignSettings || profile.design_settings || defaultSettings;

  const globalSettings = designSettings.globalSettings;
  
  // デバッグ情報：利用可能なセクション
  debugLog('利用可能なセクション:', designSettings.sections.map(s => s.id).join(', '));

  // debugLog関数はコンポーネント外で定義済み

  // セクション設定を取得する関数（改善版）
  const getSectionSettings = (sectionId: string): SectionSettings => {
    // 互換性のために特殊なケースを処理
    if (sectionId === 'description') {
      // descriptionセクションはcatchphraseセクションに統合されているため
      debugLog(`descriptionセクションにはcatchphraseセクションの設定を使用します`);
      return getSectionSettings('catchphrase');
    }
    
    // セクションを検索
    const section = designSettings.sections.find(s => s.id === sectionId);
    if (!section) {
      debugLog(`セクション設定が見つかりません: ${sectionId}、デフォルト設定を使用します`);
      
      // デフォルト設定からセクションを探す
      const defaultSection = getDefaultDesignSettings().sections.find(s => s.id === sectionId);
      
      if (defaultSection && defaultSection.settings) {
        debugLog(`デフォルト設定から ${sectionId} セクションの設定を使用します`);
        return defaultSection.settings;
      }
      
      // デフォルトの基本設定を返す
      return {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        borderColor: '#e0e0e0',
        titleColor: globalSettings.mainColor,
        fontSize: 16,
        padding: 20,
        borderRadius: 8,
        borderWidth: 1
      };
    }
    
    return section.settings || {};
  };
  
  // セクションを表示するかどうかを判定する関数（改善版）
  const isSectionVisible = (sectionId: string) => {
    // 互換性のために特殊なケースを処理
    if (sectionId === 'description') {
      // descriptionセクションはcatchphraseセクションに統合されているため
      // catchphraseセクションの可視性を継承する
      debugLog(`descriptionセクションはcatchphraseセクションの可視性を継承します`);
      return isSectionVisible('catchphrase');
    }
    
    // セクションを検索
    const section = designSettings.sections.find(s => s.id === sectionId);
    if (!section) {
      debugLog(`セクションが見つかりません: ${sectionId}`);
      
      // 特別に処理する必要があるセクション（プレビューでは表示する）
      const criticalSections = ['header', 'special_offers', 'sns_links', 'blog', 'requirements'];
      if (criticalSections.includes(sectionId)) {
        debugLog(`${sectionId} は重要なセクションなので表示します`);
        return true;
      }
      
      // 削除されたセクションは表示しない
      const removedSections = ['trial_entry', 'campaigns'];
      if (removedSections.includes(sectionId)) {
        debugLog(`${sectionId} は削除されたセクションなので表示しません`);
        return false;
      }
      
      return false; // 見つからない場合は非表示
    }
    
    return section.visible;
  };

  // セクションスタイルを生成する関数
  const getSectionStyle = (sectionId: string) => {
    const settings = getSectionSettings(sectionId) as SectionSettings;
    return {
      backgroundColor: settings.backgroundColor || '#ffffff',
      color: settings.textColor || '#333333',
      borderColor: settings.borderColor || '#e0e0e0',
      padding: `${settings.padding || 20}px`,
      borderRadius: `${settings.borderRadius || 8}px`,
      borderWidth: `${settings.borderWidth || 1}px`,
      borderStyle: 'solid',
      marginBottom: '20px'
    };
  };

  // セクションタイトルのスタイルを生成する関数
  const getSectionTitleStyle = (sectionId: string) => {
    const settings = getSectionSettings(sectionId) as SectionSettings;
    return {
      color: settings.titleColor || globalSettings.mainColor,
      fontSize: `${settings.fontSize || 18}px`,
      fontWeight: 'bold',
      marginBottom: '15px'
    };
  };
  
  // SNS URLの型を定義
  // SNS URL can be either a string or an object with platform, url, and name properties
  type SnsUrl = string | {
    platform: string;
    url: string;
    name?: string;
  };
  
  // セクションをIDに基づいてレンダリングする関数
  const renderSection = (sectionId: string) => {
    // 各セクションのレンダリングロジックを実装
    switch (sectionId) {
      case 'header':
        // ヘッダーはメインコンテンツ外でレンダリングするのでスキップ
        return null;
        
      case 'catchphrase':
        return (profile.catch_phrase || profile.description) && (
          <div key={sectionId} style={getSectionStyle('catchphrase')} className="mb-8">
            {profile.catch_phrase && (
              <h2 style={getSectionTitleStyle('catchphrase')} className="text-center p-4 mb-4">
                『{profile.catch_phrase}』
              </h2>
            )}
            
            {profile.description && (
              <>
                <div className="flex items-center mb-3">
                  <Building2 className="h-5 w-5 mr-2" style={{ color: getSectionSettings('catchphrase').titleColor || globalSettings.mainColor }} />
                  <h3 style={{ color: getSectionSettings('catchphrase').titleColor || globalSettings.mainColor, fontWeight: 'bold' }}>
                    仕事内容
                  </h3>
                </div>
                <div className="prose max-w-none" style={{ color: getSectionSettings('catchphrase').textColor || '#333333' }}>
                  <HtmlContent html={profile.description} />
                </div>
              </>
            )}
          </div>
        );
        
      case 'photo_gallery':
        // フォトギャラリーの処理
        return (
          <div key={sectionId} style={getSectionStyle('photo_gallery')} className="mb-8">
            <h3 style={getSectionTitleStyle('photo_gallery')} className="flex items-center">
              <Image className="h-5 w-5 mr-2" style={{ color: getSectionSettings('photo_gallery').titleColor || globalSettings.mainColor }} />
              写真ギャラリー
            </h3>
            
            {profile && profile.gallery_photos && profile.gallery_photos.length > 0 ? (
              <>
                <PhotoGalleryDisplay photos={profile.gallery_photos.map(photo => ({
                  id: photo.id || `photo-${Math.random().toString(36).substring(2, 9)}`,
                  url: photo.url,
                  title: photo.title || '',
                  description: photo.description || '',
                  category: photo.category || '店内',
                  order: photo.order || 0,
                  featured: photo.featured || false
                }))} />
                <p className="text-xs text-muted-foreground mt-2 text-right">※推奨画像サイズ: 200×150px</p>
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-100 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>写真ギャラリーに画像がありません</p>
                <p className="text-xs mt-2">設定画面から写真を追加できます</p>
                <p className="text-xs mt-2">※推奨画像サイズ: 200×150px</p>
              </div>
            )}
          </div>
        );
        
      case 'benefits':
        return profile && profile.benefits && profile.benefits.length > 0 && (
          <div key={sectionId} style={getSectionStyle('benefits')} className="mb-8">
            <h3 style={getSectionTitleStyle('benefits')} className="flex items-center">
              <BadgeCheck className="h-5 w-5 mr-2" style={{ color: getSectionSettings('benefits').titleColor || globalSettings.mainColor }} />
              待遇・環境
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ color: getSectionSettings('benefits').textColor || '#333333' }}>
              {profile.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <BadgeCheck className="h-4 w-4 mr-2" style={{ color: globalSettings.mainColor }} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        
      case 'salary':
        return (
          <div key={sectionId} style={getSectionStyle('salary')} className="mb-8">
            <h3 style={getSectionTitleStyle('salary')} className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" style={{ color: getSectionSettings('salary').titleColor || globalSettings.mainColor }} />
              給与情報
            </h3>
            <div className="space-y-3" style={{ color: getSectionSettings('salary').textColor || '#333333' }}>
              <div>
                <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>日給</h4>
                <p className="text-lg font-bold">
                  {profile.minimum_guarantee && profile.maximum_guarantee 
                    ? `${profile.minimum_guarantee.toLocaleString()}円〜${profile.maximum_guarantee.toLocaleString()}円`
                    : profile.minimum_guarantee 
                      ? `${profile.minimum_guarantee.toLocaleString()}円〜`
                      : profile.maximum_guarantee 
                        ? `〜${profile.maximum_guarantee.toLocaleString()}円` 
                        : "要相談"}
                </p>
              </div>
              
              {(profile.working_time_hours && profile.average_hourly_pay) && (
                <div>
                  <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>平均時給</h4>
                  <p className="font-bold">
                    {profile.working_time_hours > 0 
                      ? Math.round(profile.average_hourly_pay / profile.working_time_hours).toLocaleString() 
                      : profile.average_hourly_pay.toLocaleString()}円
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'schedule':
        return (
          <div key={sectionId} style={getSectionStyle('schedule')} className="mb-8">
            <h3 style={getSectionTitleStyle('schedule')} className="flex items-center">
              <Clock className="h-5 w-5 mr-2" style={{ color: getSectionSettings('schedule').titleColor || globalSettings.mainColor }} />
              勤務時間
            </h3>
            <p style={{ color: getSectionSettings('schedule').textColor || '#333333' }}>
              {profile.working_hours || '勤務時間が設定されていません'}
            </p>
          </div>
        );
        
      case 'requirements':
        return (
          <div key={sectionId} style={getSectionStyle('requirements')} className="mb-8">
            <h3 style={getSectionTitleStyle('requirements')} className="flex items-center">
              <User className="h-5 w-5 mr-2" style={{ color: getSectionSettings('requirements').titleColor || globalSettings.mainColor }} />
              応募条件
            </h3>
            
            {profile.requirements ? (
              <div className="space-y-3" style={{ color: getSectionSettings('requirements').textColor || '#333333' }}>
                {profile.requirements.age_min || profile.requirements.age_max ? (
                  <div>
                    <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>年齢</h4>
                    <p>
                      {profile.requirements.age_min || 18}歳以上
                      {profile.requirements.age_max ? `${profile.requirements.age_max}歳以下` : ''}
                    </p>
                  </div>
                ) : null}
                
                {profile.requirements.cup_size_conditions && 
                profile.requirements.cup_size_conditions.length > 0 && (
                  <div>
                    <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>カップサイズ条件</h4>
                    <ul className="list-disc list-inside">
                      {profile.requirements.cup_size_conditions.map((condition, index) => (
                        <li key={index}>
                          {condition.cup_size}カップ以上の方
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profile.application_requirements && (
                  <div>
                    <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>その他の条件</h4>
                    <p>{profile.application_requirements}</p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: getSectionSettings('requirements').textColor || '#333333' }}>応募条件が設定されていません</p>
            )}
          </div>
        );
        
      case 'special_offers':
        // プロファイルデータの有無にかかわらず表示する
        return (
          <div key={sectionId} style={getSectionStyle('special_offers')} className="mb-8">
            <h3 style={getSectionTitleStyle('special_offers')} className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" style={{ color: getSectionSettings('special_offers').titleColor || globalSettings.mainColor }} />
              特別オファー
            </h3>
            {profile && profile.special_offers && profile.special_offers.length > 0 ? (
              <SpecialOffersDisplay specialOffers={profile.special_offers.map(offer => ({
                id: offer.id,
                title: offer.title,
                description: offer.description,
                backgroundColor: offer.backgroundColor || '#ff4d7d',
                textColor: offer.textColor || '#333333',
                icon: offer.icon || 'sparkles',
                order: offer.order || 0,
                type: offer.type || 'discount',
                isActive: typeof offer.isActive === 'boolean' ? offer.isActive : true,
                isLimited: typeof offer.isLimited === 'boolean' ? offer.isLimited : false,
                amount: offer.amount,
                conditions: offer.conditions,
                startDate: offer.startDate,
                endDate: offer.endDate,
                limitedCount: offer.limitedCount,
                targetAudience: offer.targetAudience
              }))} />
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-100 text-gray-500">
                <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>特別オファーが設定されていません</p>
                <p className="text-xs mt-2">設定画面から特別オファーを追加できます</p>
              </div>
            )}
          </div>
        );
        
      // 体験入店保証タブとキャンペーンタブは削除されました
        
      case 'access':
        return (
          <div key={sectionId} style={getSectionStyle('access')} className="mb-8">
            <h3 style={getSectionTitleStyle('access')} className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" style={{ color: getSectionSettings('access').titleColor || globalSettings.mainColor }} />
              アクセス・住所
            </h3>
            
            <div className="space-y-3" style={{ color: getSectionSettings('access').textColor || '#333333' }}>
              <div>
                <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>エリア</h4>
                <p>{profile.location}</p>
              </div>
              
              {profile.address && (
                <div>
                  <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>住所</h4>
                  <p>{profile.address}</p>
                </div>
              )}
              
              {profile.access_info && (
                <div>
                  <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>アクセス</h4>
                  <p>{profile.access_info}</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'contact':
        return (
          <div key={sectionId} style={getSectionStyle('contact')} className="mb-8">
            <h3 style={getSectionTitleStyle('contact')} className="flex items-center">
              <Phone className="h-5 w-5 mr-2" style={{ color: getSectionSettings('contact').titleColor || globalSettings.mainColor }} />
              連絡先
            </h3>
            
            <div className="space-y-3" style={{ color: getSectionSettings('contact').textColor || '#333333' }}>
              {profile.recruiter_name && (
                <div>
                  <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>担当者</h4>
                  <p>{profile.recruiter_name}</p>
                </div>
              )}
              
              {profile.phone_numbers && profile.phone_numbers.length > 0 && (
                <div>
                  <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>電話番号</h4>
                  <ul>
                    {profile.phone_numbers.map((phone, index) => (
                      <li key={index}>{phone}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {profile.email_addresses && profile.email_addresses.length > 0 && (
                <div>
                  <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>メールアドレス</h4>
                  <ul>
                    {profile.email_addresses.map((email, index) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'sns_links':
        return profile && profile.sns_urls && Array.isArray(profile.sns_urls) && profile.sns_urls.length > 0 && (
          <div key={sectionId} style={getSectionStyle('sns_links')} className="mb-8">
            <h3 style={getSectionTitleStyle('sns_links')} className="flex items-center">
              <Share2 className="h-5 w-5 mr-2" style={{ color: getSectionSettings('sns_links').titleColor || globalSettings.mainColor }} />
              SNS
            </h3>
            <div className="flex flex-wrap gap-3 mt-4" style={{ color: getSectionSettings('sns_links').textColor || '#333333' }}>
              <SNSLinksDisplay 
                links={Array.isArray(profile.sns_urls) 
                  ? profile.sns_urls.map((sns: any) => {
                      // Handle both string URLs and object URLs
                      if (typeof sns === 'string') {
                        // If it's a string, create an object with default values
                        return {
                          platform: 'その他',
                          url: sns,
                          text: new URL(sns).hostname
                        };
                      } else {
                        // If it's already an object, use its properties
                        return {
                          platform: sns.platform || 'その他',
                          url: sns.url || '#',
                          text: sns.name || sns.platform || 'SNS'
                        };
                      }
                    })
                  : []
                } 
              />
            </div>
          </div>
        );
        
      case 'blog':
        return (
          <div key={sectionId} style={getSectionStyle('blog')} className="mb-8">
            <h3 style={getSectionTitleStyle('blog')} className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" style={{ color: getSectionSettings('blog').titleColor || globalSettings.mainColor }} />
              店舗ブログ
            </h3>
            <RouterLink 
              to={`/blog?store_id=${profile.id}`}
              className="inline-flex items-center px-4 py-2 rounded-md mt-3"
              style={{ 
                backgroundColor: globalSettings.mainColor,
                color: '#ffffff'
              }}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              ブログを読む
            </RouterLink>
          </div>
        );
        
      default:
        debugLog(`未対応のセクションID: ${sectionId}`);
        return null;
    }
  };
  
  // セクションの順序に従って動的にレンダリングする関数
  const renderOrderedSections = () => {
    // ヘッダーはすでに別途レンダリングされているので除外
    // 表示可能なセクションのみを抽出
    const contentSections = [...designSettings.sections]
      .filter(section => section.id !== 'header');
    
    // 店舗情報編集ページで設定した順序を反映するためにorder値で並べ替え
    contentSections.sort((a, b) => {
      // ヘッダーは常に先頭（ただし別途レンダリングされるので、ここでは無視）
      if (a.id === 'header') return -1;
      if (b.id === 'header') return 1;
      
      // orderプロパティに基づいてセクションを並べ替え（デザイン管理ページの順序を維持）
      return a.order - b.order;
    });
    
    // デバッグ用：設定・順番の詳細情報を出力
    debugLog(`詳細な順序情報:`, contentSections.map(s => ({
      id: s.id,
      order: s.order,
      title: s.title,
      visible: s.visible
    })));
    
    // デバッグ用のセクション順序ログ
    debugLog(`レンダリング順序: ${contentSections.map(s => s.id).join(', ')}`);
    
    // セクションを順序に従ってレンダリング
    return contentSections.map(section => {
      // セクションが表示可能かチェック
      if (!isSectionVisible(section.id)) {
        return null;
      }
      
      // デバッグログ（どのセクションが処理されているか）
      debugLog(`セクション ${section.id} をレンダリングします`);
      
      // セクションをレンダリング
      return renderSection(section.id);
    });
  };

  return (
    <div className="bg-white min-h-screen" 
      style={{ 
        backgroundColor: globalSettings.backgroundColor,
        fontFamily: globalSettings.fontFamily
      }}>
      {/* ナビゲーションバー */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.href = '/store/dashboard'} 
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>

          <div className="flex items-center">
            <span className="font-bold mr-4">プレビュー画面</span>
            <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
              <Button 
                variant={deviceView === 'pc' ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setDeviceView('pc')}
              >
                <Monitor className="h-4 w-4 mr-1" />
                PC
              </Button>
              <Button 
                variant={deviceView === 'smartphone' ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setDeviceView('smartphone')}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                スマホ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* プレビュー画面表示エリア */}
      <div className={cn(
        "mx-auto transition-all duration-300 overflow-hidden",
        deviceView === 'pc' ? "max-w-5xl w-full" : "max-w-sm"
      )}>
        <div className={cn(
          "bg-gray-100 mx-auto border-x min-h-[800px]",
          deviceView === 'smartphone' && "border-t border-b rounded-b-xl"
        )}>
          {/* スマホ表示の時はデバイスフレームを表示 */}
          {deviceView === 'smartphone' && (
            <div className="flex justify-center items-center h-8 bg-gray-200 border-b relative rounded-t-xl">
              <div className="w-20 h-4 bg-gray-300 rounded-full"></div>
            </div>
          )}

          {/* 注意書き */}
          <div className="p-4 bg-pink-50 border-b border-pink-100">
            <p className="text-sm text-pink-700 flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                <span className="font-bold">これはプレビュー画面です。</span> 実際の応募者向け公開ページは、ここでの設定に基づいて自動的に最適化されます。
                <span className="block mt-1 text-xs">※写真ギャラリーの画像は実際のサイズ（幅200px × 高さ150px推奨）で表示されます。</span>
              </span>
            </p>
          </div>

          <div ref={mainContentRef} className="bg-white overflow-auto">
            {/* 動的に順序付けされたセクションの表示 */}
            {/* ヘッダーセクションは特別に先頭に表示 */}
            {isSectionVisible('header') && (
              <header style={getSectionStyle('header')} 
                className="border-b">
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <h1 className="text-2xl font-bold" 
                    style={{ color: (getSectionSettings('header') as SectionSettings).titleColor || '#333333' }}>
                    {profile && profile.business_name || 'テスト店舗'}
                  </h1>
                  <div className="flex items-center mt-2" 
                    style={{ color: (getSectionSettings('header') as SectionSettings).textColor || '#666666' }}>
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="mr-3">{profile && profile.location || ''}</span>
                    <span className="px-2 py-0.5 rounded text-sm" 
                      style={{ 
                        backgroundColor: globalSettings.secondaryColor,
                        color: globalSettings.mainColor 
                      }}>
                      {profile && profile.service_type || ''}
                    </span>
                  </div>
                </div>
              </header>
            )}

            {/* メインコンテンツ */}
            <main className="px-4 py-6" style={{ 
              maxWidth: `${globalSettings.maxWidth}px`,
              margin: '0 auto'
            }}>
              {/* 設定の順序に従ってセクションを動的にレンダリング */}
              {renderOrderedSections()}



              {/* 
                各セクションは renderOrderedSectionsで動的に生成されるため
                個別のセクションレンダリングコードは削除しました
              */}

            </main>

            {/* フッター */}
            <footer className="border-t mt-8 py-6" style={{ 
              backgroundColor: globalSettings.secondaryColor,
              color: globalSettings.mainColor 
            }}>
              <div className="max-w-4xl mx-auto px-4 text-center">
                <p className="text-sm mb-2">
                  <span className="font-bold">以下は入力した情報の表示確認用です。</span>
                </p>
                <p className="text-xs opacity-80">実際の応募者向けページは、当社専門チームによるデザイン最適化処理が適用されます。</p>
              </div>
            </footer>
          </div>

          {/* スマホ表示の時はデバイスフレームを表示（下部） */}
          {deviceView === 'smartphone' && (
            <div className="flex justify-center items-center h-6 bg-gray-200 border-t relative rounded-b-xl">
              <div className="w-12 h-2 bg-gray-300 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}