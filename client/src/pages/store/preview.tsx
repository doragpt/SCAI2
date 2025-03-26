import React, { useState, useEffect, useRef } from 'react';
import { HtmlContent } from '@/components/html-content';
import { type StoreProfile, type DesignSettings } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { PhotoGalleryDisplay } from '@/components/store/PhotoGalleryDisplay';
import { 
  Building2, Clock, MapPin, Phone, Mail, BadgeCheck, 
  Image, User, DollarSign, Info, ArrowLeft,
  Monitor, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * デザイン設定を反映した店舗ページのプレビューコンポーネント
 * デザイン管理機能で設定されたスタイルやセクションの表示/非表示、順序を反映します
 */
export default function StorePreview() {
  const [deviceView, setDeviceView] = useState<'pc' | 'smartphone'>('pc');
  const mainContentRef = useRef<HTMLDivElement>(null);

  // 店舗データを取得
  const { data: profile, isLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/store/profile');
      return response as StoreProfile;
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
      if (event.data.type === 'UPDATE_DESIGN') {
        console.log('デザイン設定更新メッセージを受信:', event.data);
        applyDesignSettings(event.data.settings);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
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

  // デザイン設定を取得、なければデフォルト設定を使用
  const designSettings = profile.design_settings || {
    sections: [
      {
        id: "header",
        title: "ヘッダー",
        visible: true,
        order: 1,
        settings: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          titleColor: "#ff69b4"
        }
      },
      {
        id: "catchphrase",
        title: "キャッチフレーズ",
        visible: true,
        order: 2,
        settings: {
          backgroundColor: "#fff5f8",
          textColor: "#333333",
          titleColor: "#ff69b4"
        }
      },
      // 他のデフォルトセクション...
    ],
    globalSettings: {
      mainColor: "#ff69b4",
      secondaryColor: "#fff5f8",
      accentColor: "#ff1493",
      backgroundColor: "#ffffff",
      fontFamily: "Arial, sans-serif",
      borderRadius: 8,
      maxWidth: 1200
    }
  };

  const globalSettings = designSettings.globalSettings;
  
  // 表示するセクションを取得し、順序でソート
  const visibleSections = designSettings.sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

  // セクション設定を取得する関数
  const getSectionSettings = (sectionId: string) => {
    const section = designSettings.sections.find(s => s.id === sectionId);
    return section?.settings || {};
  };
  
  // セクションを表示するかどうかを判定する関数
  const isSectionVisible = (sectionId: string) => {
    const section = designSettings.sections.find(s => s.id === sectionId);
    return section?.visible || false;
  };

  // セクションスタイルを生成する関数
  const getSectionStyle = (sectionId: string) => {
    const settings = getSectionSettings(sectionId);
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
    const settings = getSectionSettings(sectionId);
    return {
      color: settings.titleColor || globalSettings.mainColor,
      fontSize: `${settings.fontSize || 18}px`,
      fontWeight: 'bold',
      marginBottom: '15px'
    };
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
        deviceView === 'pc' ? "max-w-4xl" : "max-w-sm"
      )}>
        <div className={cn(
          "bg-gray-100 mx-auto border-x",
          deviceView === 'smartphone' && "border-t border-b rounded-b-xl"
        )}>
          {/* スマホ表示の時はデバイスフレームを表示 */}
          {deviceView === 'smartphone' && (
            <div className="flex justify-center items-center h-8 bg-gray-200 border-b relative rounded-t-xl">
              <div className="w-20 h-4 bg-gray-300 rounded-full"></div>
            </div>
          )}

          {/* 注意書き */}
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700 flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              これはプレビュー画面です。実際の公開ページはもう少し詳細なデザインになります。
            </p>
          </div>

          <div ref={mainContentRef} className="bg-white overflow-auto">
            {/* ヘッダー */}
            {isSectionVisible('header') && (
              <header style={getSectionStyle('header')} 
                className="border-b">
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <h1 className="text-2xl font-bold" 
                    style={{ color: getSectionSettings('header').titleColor || '#333333' }}>
                    {profile.business_name || 'テスト店舗'}
                  </h1>
                  <div className="flex items-center mt-2" 
                    style={{ color: getSectionSettings('header').textColor || '#666666' }}>
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
              {/* キャッチコピー */}
              {isSectionVisible('catchphrase') && profile.catch_phrase && (
                <div style={getSectionStyle('catchphrase')} className="mb-8 text-center p-4">
                  <h2 style={getSectionTitleStyle('catchphrase')}>
                    『{profile.catch_phrase}』
                  </h2>
                </div>
              )}

              {/* 仕事内容 */}
              {isSectionVisible('description') && profile.description && (
                <div style={getSectionStyle('description')} className="mb-8">
                  <h3 style={getSectionTitleStyle('description')} className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" style={{ color: getSectionSettings('description').titleColor || globalSettings.mainColor }} />
                    仕事内容
                  </h3>
                  <div className="prose max-w-none" style={{ color: getSectionSettings('description').textColor || '#333333' }}>
                    <HtmlContent html={profile.description} />
                  </div>
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
            </main>

            {/* フッター */}
            <footer className="border-t mt-8 py-4" style={{ 
              backgroundColor: globalSettings.secondaryColor,
              color: globalSettings.mainColor 
            }}>
              <div className="max-w-4xl mx-auto px-4 text-center text-sm">
                <p>このプレビューは管理用です。実際の公開ページとは異なる場合があります。</p>
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