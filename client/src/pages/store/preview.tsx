import React, { useEffect, useState } from 'react';
import { HtmlContent } from '@/components/html-content';
import { type StoreProfile } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TrialEntryDisplay } from '@/components/store/TrialEntryDisplay';
import { CampaignDisplay } from '@/components/store/CampaignDisplay';
import { LocationDisplay } from '@/components/store/LocationDisplay';
import { ContactDisplay } from '@/components/store/ContactDisplay';
import { SalaryDisplay } from '@/components/store/SalaryDisplay';
import { JobDescriptionDisplay } from '@/components/store/JobDescriptionDisplay';
import { BookOpenCheck, Clock, Calendar, MapPin, Phone, Mail, Star, Gift, BadgeCheck, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// デザイン設定の型定義
interface DesignSettings {
  sections: {
    id: string;
    title: string;
    visible: boolean;
    order: number;
    settings: {
      backgroundColor?: string;
      textColor?: string;
      borderColor?: string;
      titleColor?: string;
      fontSize?: number;
      padding?: number;
      borderRadius?: number;
      borderWidth?: number;
    };
  }[];
  globalSettings: {
    mainColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: number;
    maxWidth: number;
  };
}

export default function StorePreview() {
  const [designSettings, setDesignSettings] = useState<DesignSettings | null>(null);
  
  // 店舗データを取得
  const { data: profile, isLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/store/profile');
      return response as StoreProfile;
    }
  });

  // MessageEvent リスナーを追加
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 親ウィンドウからのメッセージを処理
      if (event.data && event.data.type === 'UPDATE_DESIGN') {
        setDesignSettings(event.data.settings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // デザイン設定から CSS 変数を生成
  const generateCssVariables = () => {
    if (!designSettings) return {};

    return {
      '--main-color': designSettings.globalSettings.mainColor,
      '--secondary-color': designSettings.globalSettings.secondaryColor,
      '--accent-color': designSettings.globalSettings.accentColor,
      '--background-color': designSettings.globalSettings.backgroundColor,
      '--font-family': designSettings.globalSettings.fontFamily,
      '--border-radius': `${designSettings.globalSettings.borderRadius}px`,
      '--max-width': `${designSettings.globalSettings.maxWidth}px`,
    };
  };

  // セクションの設定を取得
  const getSectionSettings = (sectionId: string) => {
    if (!designSettings) return null;
    
    const section = designSettings.sections.find(s => s.id === sectionId);
    if (!section || !section.visible) return null;
    
    return {
      ...section,
      style: {
        backgroundColor: section.settings.backgroundColor,
        color: section.settings.textColor,
        borderColor: section.settings.borderColor,
        fontSize: `${section.settings.fontSize}px`,
        padding: `${section.settings.padding}px`,
        borderRadius: `${section.settings.borderRadius}px`,
        borderWidth: `${section.settings.borderWidth}px`,
        borderStyle: section.settings.borderWidth && section.settings.borderWidth > 0 ? 'solid' : 'none',
      },
      titleStyle: {
        color: section.settings.titleColor,
      }
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">プロフィールが見つかりません</h2>
        <p>店舗プロフィールが設定されていません。まずはプロフィールを作成してください。</p>
      </div>
    );
  }

  // 各セクションを取得
  const catchphraseSection = getSectionSettings('catchphrase');
  const benefitsSection = getSectionSettings('benefits');
  const requirementsSection = getSectionSettings('requirements');
  const salarySection = getSectionSettings('salary');
  const scheduleSection = getSectionSettings('schedule');
  const accessSection = getSectionSettings('access');
  const contactSection = getSectionSettings('contact');
  const trialEntrySection = getSectionSettings('trial_entry');
  const campaignsSection = getSectionSettings('campaigns');

  return (
    <div 
      className="bg-background min-h-screen"
      style={generateCssVariables()}
    >
      {/* ヘッダー */}
      <header className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">{profile.business_name || 'テスト店舗'}</h1>
          <p className="text-sm opacity-80">
            {profile.location} | {profile.service_type}
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* キャッチコピー・仕事内容 */}
        {(!designSettings || catchphraseSection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={catchphraseSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={catchphraseSection?.titleStyle}
            >
              <BookOpenCheck className="inline-block mr-2 h-5 w-5" />
              キャッチコピー・仕事内容
            </h2>
            <div className="p-4">
              <div className="text-center mb-4">
                <p className="text-xl font-bold">{profile.catch_phrase}</p>
              </div>
              <JobDescriptionDisplay description={profile.description || ''} />
            </div>
          </section>
        )}

        {/* 待遇・環境 */}
        {(!designSettings || benefitsSection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={benefitsSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={benefitsSection?.titleStyle}
            >
              <Star className="inline-block mr-2 h-5 w-5" />
              待遇・環境
            </h2>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.benefits && profile.benefits.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <BadgeCheck className="h-5 w-5 mr-2 text-primary" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>待遇情報がまだ登録されていません。</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 応募条件 */}
        {(!designSettings || requirementsSection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={requirementsSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={requirementsSection?.titleStyle}
            >
              <Shield className="inline-block mr-2 h-5 w-5" />
              応募条件
            </h2>
            <div className="p-4">
              <div className="space-y-4">
                {profile.requirements ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">年齢</h3>
                        <p>{profile.requirements.age_min || 18}歳以上{profile.requirements.age_max ? `${profile.requirements.age_max}歳以下` : ''}</p>
                      </div>
                      
                      {profile.requirements.cup_size_conditions && profile.requirements.cup_size_conditions.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">カップサイズ条件</h3>
                          <ul className="list-disc list-inside">
                            {profile.requirements.cup_size_conditions.map((condition, index) => (
                              <li key={index}>
                                {condition.cup_size}カップ以上の方
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {profile.application_requirements && (
                      <div>
                        <h3 className="font-semibold mb-2">その他の条件</h3>
                        <p>{profile.application_requirements}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p>応募条件が設定されていません。</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 給与情報 */}
        {(!designSettings || salarySection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={salarySection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={salarySection?.titleStyle}
            >
              <BadgeCheck className="inline-block mr-2 h-5 w-5" />
              給与情報
            </h2>
            <div className="p-4">
              <SalaryDisplay 
                minGuarantee={profile.minimum_guarantee} 
                maxGuarantee={profile.maximum_guarantee}
                workingTimeHours={profile.working_time_hours}
                averageHourlyPay={profile.average_hourly_pay}
                salaryExamples={profile.salary_examples || []}
              />
            </div>
          </section>
        )}

        {/* 勤務時間 */}
        {(!designSettings || scheduleSection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={scheduleSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={scheduleSection?.titleStyle}
            >
              <Clock className="inline-block mr-2 h-5 w-5" />
              勤務時間
            </h2>
            <div className="p-4">
              <p>{profile.working_hours || '勤務時間が設定されていません。'}</p>
            </div>
          </section>
        )}

        {/* アクセス・住所 */}
        {(!designSettings || accessSection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={accessSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={accessSection?.titleStyle}
            >
              <MapPin className="inline-block mr-2 h-5 w-5" />
              アクセス・住所
            </h2>
            <div className="p-4">
              <LocationDisplay location={profile.location} address={profile.address} accessInfo={profile.access_info} />
            </div>
          </section>
        )}

        {/* 応募方法・連絡先 */}
        {(!designSettings || contactSection) && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={contactSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={contactSection?.titleStyle}
            >
              <Phone className="inline-block mr-2 h-5 w-5" />
              応募方法・連絡先
            </h2>
            <div className="p-4">
              <ContactDisplay 
                recruiterName={profile.recruiter_name} 
                phoneNumbers={profile.phone_numbers} 
                emailAddresses={profile.email_addresses}
                pcWebsiteUrl={profile.pc_website_url}
                mobileWebsiteUrl={profile.mobile_website_url}
              />
            </div>
          </section>
        )}

        {/* 体験入店情報 */}
        {(!designSettings || trialEntrySection) && profile.trial_entry && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={trialEntrySection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={trialEntrySection?.titleStyle}
            >
              <Calendar className="inline-block mr-2 h-5 w-5" />
              体験入店情報
            </h2>
            <div className="p-4">
              {profile.trial_entry ? (
                <TrialEntryDisplay data={profile.trial_entry} />
              ) : (
                <p>体験入店情報が設定されていません。</p>
              )}
            </div>
          </section>
        )}

        {/* キャンペーン情報 */}
        {(!designSettings || campaignsSection) && profile.campaigns && profile.campaigns.length > 0 && (
          <section 
            className="mb-8 border rounded-lg overflow-hidden"
            style={campaignsSection?.style}
          >
            <h2 
              className="text-xl font-bold p-4 border-b bg-primary/10"
              style={campaignsSection?.titleStyle}
            >
              <Gift className="inline-block mr-2 h-5 w-5" />
              キャンペーン情報
            </h2>
            <div className="p-4">
              {profile.campaigns && profile.campaigns.length > 0 ? (
                <CampaignDisplay campaigns={profile.campaigns} />
              ) : (
                <p>現在実施中のキャンペーンはありません。</p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <p className="text-center">&copy; 2025 {profile.business_name || 'テスト店舗'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}