import React, { useState, useEffect, useRef } from 'react';
import { HtmlContent } from '@/components/html-content';
import { type StoreProfile, type DesignSettings, type SectionSettings, type DesignSection } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Link as RouterLink } from 'wouter';
import { PhotoGalleryDisplay } from '@/components/store/PhotoGalleryDisplay';
import { SpecialOffersDisplay } from '@/components/store/SpecialOffersDisplay';
import { TrialEntryDisplay } from '@/components/store/TrialEntryDisplay';
import { CampaignDisplay } from '@/components/store/CampaignDisplay';
import { SNSLinksDisplay } from '@/components/store/SNSLinksDisplay';
import { 
  Building2, Clock, MapPin, Phone, Mail, BadgeCheck, 
  Image, User, DollarSign, Info, ArrowLeft,
  Monitor, Smartphone, FileText, BookOpen, File,
  Gift, MessageSquare, PartyPopper, Sparkles,
  Share2, Link as LinkIcon, Video, Twitter as TwitterIcon, Instagram as InstagramIcon
} from 'lucide-react';
import { 
  type TrialEntryData, 
  type CampaignData, 
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
function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Preview Debug] ${message}`, data || '');
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
        console.log('店舗プロフィールを取得しています...');
        const response = await apiRequest("GET", "/store/profile");
        console.log('店舗プロフィール取得成功:', response);
        return response as StoreProfile;
      } catch (error) {
        console.error('店舗プロフィール取得エラー:', error);
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
      
      console.log('デザイン設定を適用しました', {
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
            console.error('デザイン設定の適用に失敗しました:', error);
          }
        } else {
          console.warn('デザイン設定が見つかりません:', event.data);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    console.log('メッセージリスナーを登録しました', { time: new Date().toISOString() });
    
    // 親ウィンドウに準備完了を通知
    try {
      window.parent.postMessage({ type: 'PREVIEW_READY', timestamp: new Date().toISOString() }, '*');
      console.log('親ウィンドウに準備完了を通知しました');
    } catch (error) {
      console.warn('親ウィンドウへの通知に失敗しました:', error);
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
  
  // 表示するセクションを取得し、順序でソート
  const visibleSections = designSettings.sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

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
      console.log(`[Preview] descriptionセクションはcatchphraseセクションの可視性を継承します`);
      return isSectionVisible('catchphrase');
    }
    
    // セクションを検索
    const section = designSettings.sections.find(s => s.id === sectionId);
    if (!section) {
      console.log(`[Preview] セクションが見つかりません: ${sectionId}`);
      
      // 特別に処理する必要があるセクション（プレビューでは表示する）
      const criticalSections = ['header', 'special_offers', 'sns_links', 'blog'];
      if (criticalSections.includes(sectionId)) {
        console.log(`[Preview] ${sectionId} は重要なセクションなので表示します`);
        return true;
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
  type SnsUrl = {
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
        return profile.gallery_photos && profile.gallery_photos.length > 0 && (
          <div key={sectionId} style={getSectionStyle('photo_gallery')} className="mb-8">
            <h3 style={getSectionTitleStyle('photo_gallery')} className="flex items-center">
              <Image className="h-5 w-5 mr-2" style={{ color: getSectionSettings('photo_gallery').titleColor || globalSettings.mainColor }} />
              写真ギャラリー
            </h3>
            <PhotoGalleryDisplay photos={profile.gallery_photos} />
            <p className="text-xs text-muted-foreground mt-2 text-right">※推奨画像サイズ: 200×150px</p>
          </div>
        );
        
      case 'benefits':
        return profile.benefits && profile.benefits.length > 0 && (
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
        return profile.special_offers && profile.special_offers.length > 0 && (
          <div key={sectionId} style={getSectionStyle('special_offers')} className="mb-8">
            <h3 style={getSectionTitleStyle('special_offers')} className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" style={{ color: getSectionSettings('special_offers').titleColor || globalSettings.mainColor }} />
              特別オファー
            </h3>
            <SpecialOffersDisplay specialOffers={profile.special_offers?.map(offer => ({
              backgroundColor: '#ff4d7d',
              textColor: '#333333',
              icon: 'sparkles',
              order: 0,
              ...offer
            }))} />
          </div>
        );
        
      case 'trial_entry':
        return profile.trial_entry && (
          <div key={sectionId} style={getSectionStyle('trial_entry')} className="mb-8">
            <h3 style={getSectionTitleStyle('trial_entry')} className="flex items-center">
              <Gift className="h-5 w-5 mr-2" style={{ color: getSectionSettings('trial_entry').titleColor || globalSettings.mainColor }} />
              体験入店保証
            </h3>
            <TrialEntryDisplay trialEntry={{
              dailyGuarantee: profile.trial_entry.daily_guarantee,
              hourlyRate: profile.trial_entry.hourly_rate,
              workingHours: profile.trial_entry.working_hours,
              requirements: profile.trial_entry.requirements,
              benefitsDescription: profile.trial_entry.benefits_description,
              startDate: profile.trial_entry.start_date,
              endDate: profile.trial_entry.end_date,
              isActive: profile.trial_entry.is_active,
              examples: profile.trial_entry.examples,
              requiredDocuments: profile.trial_entry.required_documents,
              qaItems: profile.trial_entry.qa_items
            }} />
          </div>
        );
        
      case 'campaigns':
        return profile.campaigns && profile.campaigns.length > 0 && (
          <div key={sectionId} style={getSectionStyle('campaigns')} className="mb-8">
            <h3 style={getSectionTitleStyle('campaigns')} className="flex items-center">
              <PartyPopper className="h-5 w-5 mr-2" style={{ color: getSectionSettings('campaigns').titleColor || globalSettings.mainColor }} />
              キャンペーン
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {profile.campaigns.map((campaign, index) => (
                <CampaignDisplay key={index} campaign={{
                  id: campaign.id || `campaign-${index}`,
                  title: campaign.title,
                  description: campaign.description,
                  amount: campaign.amount,
                  type: campaign.type,
                  conditions: campaign.conditions,
                  startDate: campaign.startDate,
                  endDate: campaign.endDate,
                  isActive: campaign.isActive,
                  isLimited: campaign.isLimited,
                  targetAudience: campaign.targetAudience
                }} />
              ))}
            </div>
          </div>
        );
        
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
        return profile.sns_urls && profile.sns_urls.length > 0 && (
          <div key={sectionId} style={getSectionStyle('sns_links')} className="mb-8">
            <h3 style={getSectionTitleStyle('sns_links')} className="flex items-center">
              <Share2 className="h-5 w-5 mr-2" style={{ color: getSectionSettings('sns_links').titleColor || globalSettings.mainColor }} />
              SNS
            </h3>
            <div className="flex flex-wrap gap-3 mt-4" style={{ color: getSectionSettings('sns_links').textColor || '#333333' }}>
              {profile.sns_urls.map((sns, index) => (
                <a 
                  key={index}
                  href={sns.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-full"
                  style={{ 
                    backgroundColor: globalSettings.secondaryColor,
                    color: globalSettings.mainColor
                  }}
                >
                  {sns.platform === 'twitter' && <TwitterIcon className="h-5 w-5 mr-2" />}
                  {sns.platform === 'instagram' && <InstagramIcon className="h-5 w-5 mr-2" />}
                  {sns.platform === 'line' && <MessageSquare className="h-5 w-5 mr-2" />}
                  {sns.platform === 'tiktok' && <Video className="h-5 w-5 mr-2" />}
                  {sns.platform === 'other' && <Link className="h-5 w-5 mr-2" />}
                  {sns.name || sns.platform}
                </a>
              ))}
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
            <Link 
              to={`/blog?store_id=${profile.id}`}
              className="inline-flex items-center px-4 py-2 rounded-md mt-3"
              style={{ 
                backgroundColor: globalSettings.mainColor,
                color: '#ffffff'
              }}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              ブログを読む
            </Link>
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
    const contentSections = visibleSections.filter(section => section.id !== 'header');
    
    // セクションを順序に従ってレンダリング
    return contentSections.map(section => {
      // セクションが表示可能かチェック
      if (!isSectionVisible(section.id)) {
        return null;
      }
      
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
                    {profile.business_name || 'テスト店舗'}
                  </h1>
                  <div className="flex items-center mt-2" 
                    style={{ color: (getSectionSettings('header') as SectionSettings).textColor || '#666666' }}>
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="mr-3">{profile.location}</span>
                    <span className="px-2 py-0.5 rounded text-sm" 
                      style={{ 
                        backgroundColor: globalSettings.secondaryColor,
                        color: globalSettings.mainColor 
                      }}>
                      {profile.service_type}
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
              
              {/* 以下は古いレンダリング方法（renderOrderedSectionsが使用されるので非表示） */}
              {false && isSectionVisible('catchphrase') && (profile.catch_phrase || profile.description) && (
                <div style={getSectionStyle('catchphrase')} className="mb-8">
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
              )}

              {/* フォトギャラリー - 写真ギャラリーセクション */}
              {isSectionVisible('photo_gallery') && profile.gallery_photos && profile.gallery_photos.length > 0 && (
                <div style={getSectionStyle('photo_gallery')} className="mb-8">
                  <h3 style={getSectionTitleStyle('photo_gallery')} className="flex items-center">
                    <Image className="h-5 w-5 mr-2" style={{ color: getSectionSettings('photo_gallery').titleColor || globalSettings.mainColor }} />
                    写真ギャラリー
                  </h3>
                  <PhotoGalleryDisplay photos={profile.gallery_photos} />
                  <p className="text-xs text-muted-foreground mt-2 text-right">※推奨画像サイズ: 200×150px</p>
                </div>
              )}

              {/* 待遇・環境 */}
              {isSectionVisible('benefits') && profile.benefits && profile.benefits.length > 0 && (
                <div style={getSectionStyle('benefits')} className="mb-8">
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
              )}

              {/* 給与情報 */}
              {isSectionVisible('salary') && (
                <div style={getSectionStyle('salary')} className="mb-8">
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
              )}

              {/* 勤務時間 */}
              {isSectionVisible('schedule') && (
                <div style={getSectionStyle('schedule')} className="mb-8">
                  <h3 style={getSectionTitleStyle('schedule')} className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" style={{ color: getSectionSettings('schedule').titleColor || globalSettings.mainColor }} />
                    勤務時間
                  </h3>
                  <p style={{ color: getSectionSettings('schedule').textColor || '#333333' }}>
                    {profile.working_hours || '勤務時間が設定されていません'}
                  </p>
                </div>
              )}

              {/* 応募条件 */}
              {isSectionVisible('requirements') && (
                <div style={getSectionStyle('requirements')} className="mb-8">
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
              )}

              {/* 特別オファー */}
              {isSectionVisible('special_offers') && profile.special_offers && profile.special_offers.length > 0 && (
                <div style={getSectionStyle('special_offers')} className="mb-8">
                  <h3 style={getSectionTitleStyle('special_offers')} className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" style={{ color: getSectionSettings('special_offers').titleColor || globalSettings.mainColor }} />
                    特別オファー
                  </h3>
                  <SpecialOffersDisplay specialOffers={profile.special_offers?.map(offer => ({
                    backgroundColor: '#ff4d7d',
                    textColor: '#333333',
                    icon: 'sparkles',
                    order: 0,
                    ...offer
                  }))} />
                </div>
              )}

              {/* 体験入店保証 */}
              {isSectionVisible('trial_entry') && profile.trial_entry && (
                <div style={getSectionStyle('trial_entry')} className="mb-8">
                  <h3 style={getSectionTitleStyle('trial_entry')} className="flex items-center">
                    <Gift className="h-5 w-5 mr-2" style={{ color: getSectionSettings('trial_entry').titleColor || globalSettings.mainColor }} />
                    体験入店保証
                  </h3>
                  <TrialEntryDisplay trialEntry={{
                    dailyGuarantee: profile.trial_entry.daily_guarantee,
                    hourlyRate: profile.trial_entry.hourly_rate,
                    workingHours: profile.trial_entry.working_hours,
                    requirements: profile.trial_entry.requirements,
                    benefitsDescription: profile.trial_entry.benefits_description,
                    startDate: profile.trial_entry.start_date,
                    endDate: profile.trial_entry.end_date,
                    isActive: profile.trial_entry.is_active,
                    examples: profile.trial_entry.examples,
                    requiredDocuments: profile.trial_entry.required_documents,
                    qaItems: profile.trial_entry.qa_items
                  }} />
                </div>
              )}

              {/* キャンペーン */}
              {isSectionVisible('campaigns') && profile.campaigns && profile.campaigns.length > 0 && (
                <div style={getSectionStyle('campaigns')} className="mb-8">
                  <h3 style={getSectionTitleStyle('campaigns')} className="flex items-center">
                    <PartyPopper className="h-5 w-5 mr-2" style={{ color: getSectionSettings('campaigns').titleColor || globalSettings.mainColor }} />
                    キャンペーン
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {profile.campaigns.map((campaign, index) => (
                      <CampaignDisplay key={index} campaign={{
                        id: campaign.id || `campaign-${index}`,
                        title: campaign.title,
                        description: campaign.description,
                        amount: campaign.amount,
                        type: campaign.type,
                        conditions: campaign.conditions,
                        startDate: campaign.startDate,
                        endDate: campaign.endDate,
                        isActive: campaign.isActive,
                        isLimited: campaign.isLimited,
                        targetAudience: campaign.targetAudience
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* アクセス・住所 */}
              {isSectionVisible('access') && (
                <div style={getSectionStyle('access')} className="mb-8">
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
              )}

              {/* 連絡先 */}
              {isSectionVisible('contact') && (
                <div style={getSectionStyle('contact')} className="mb-8">
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
                        <ul className="space-y-1">
                          {profile.phone_numbers.map((phone, index) => (
                            <li key={index} className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" style={{ color: globalSettings.mainColor }} />
                              <span>{phone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {profile.email_addresses && profile.email_addresses.length > 0 && (
                      <div>
                        <h4 className="font-medium" style={{ color: globalSettings.mainColor }}>メールアドレス</h4>
                        <ul className="space-y-1">
                          {profile.email_addresses.map((email, index) => (
                            <li key={index} className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" style={{ color: globalSettings.mainColor }} />
                              <span>{email}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SNSリンク */}
              {isSectionVisible('sns_links') && (
                (profile.sns_id || profile.sns_url || profile.sns_text || 
                (profile.sns_urls && profile.sns_urls.length > 0)) && (
                <div style={getSectionStyle('sns_links')} className="mb-8">
                  <h3 style={getSectionTitleStyle('sns_links')} className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" style={{ color: getSectionSettings('sns_links').titleColor || globalSettings.mainColor }} />
                    公式SNS
                  </h3>
                  
                  <SNSLinksDisplay 
                    links={(profile.sns_urls || []).map(url => {
                      // URLからプラットフォームを推測
                      let platform = 'その他';
                      if (url.includes('twitter.com') || url.includes('x.com')) platform = 'Twitter';
                      else if (url.includes('instagram.com')) platform = 'Instagram';
                      else if (url.includes('facebook.com')) platform = 'Facebook';
                      else if (url.includes('youtube.com')) platform = 'Youtube';
                      else if (url.includes('line.me')) platform = 'Line';
                      
                      return {
                        platform,
                        url,
                        text: platform
                      };
                    })}
                    snsId={profile.sns_id || undefined}
                    snsUrl={profile.sns_url || undefined}
                    snsText={profile.sns_text || undefined}
                    textColor={getSectionSettings('sns_links').textColor}
                  />
                </div>
              ))}

              {/* 店舗ブログ */}
              {isSectionVisible('blog') && (
                <div style={getSectionStyle('blog')} className="mb-8">
                  <h3 style={getSectionTitleStyle('blog')} className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" style={{ color: getSectionSettings('blog').titleColor || globalSettings.mainColor }} />
                    店舗ブログ
                  </h3>
                  
                  <div className="space-y-4" style={{ color: getSectionSettings('blog').textColor || '#333333' }}>
                    {/* ブログ記事リスト（最新3件のみ表示） */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((_, index) => (
                        <div key={index} className="border rounded-md overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-gray-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                              <Image className="h-10 w-10" />
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="text-xs text-gray-500 mb-1">{new Date().toLocaleDateString('ja-JP')}</div>
                            <h4 className="font-medium mb-2 line-clamp-1" style={{ color: globalSettings.mainColor }}>
                              ブログ記事タイトルがここに表示されます
                            </h4>
                            <p className="text-sm line-clamp-2">
                              ブログ記事の内容がここに表示されます。実際の記事が投稿されると、ここにその記事の抜粋が表示されます。
                            </p>
                            <div className="mt-2 text-right">
                              <span className="text-sm" style={{ color: globalSettings.mainColor }}>
                                続きを読む →
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center mt-4">
                      <a href={`/blog?store_id=${profile.id}`} target="_blank" rel="noopener noreferrer" 
                         className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md cursor-pointer" 
                         style={{ 
                          backgroundColor: globalSettings.mainColor, 
                          color: '#ffffff'
                         }}>
                        <File className="h-4 w-4 mr-2" />
                        ブログ一覧を見る
                      </a>
                    </div>
                  </div>
                </div>
              )}
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