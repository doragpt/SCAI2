import React from 'react';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';
import { type DesignSettings, type DesignSection } from '@shared/schema';
import { dataUtils } from '@/shared/utils/dataTypeUtils';
import { processSalaryExample, calculateHourlyRate } from '@/utils/salaryUtils';

interface PreviewRendererProps {
  settings: DesignSettings;
  storeProfile: any; // 店舗プロフィールデータ
  deviceView?: 'pc' | 'smartphone';
}

/**
 * プレビューコンポーネント
 * iframeに依存せず、Reactコンポーネントとして店舗ページをレンダリング
 */
const PreviewRenderer: React.FC<PreviewRendererProps> = ({ 
  settings, 
  storeProfile, 
  deviceView = 'pc' 
}) => {
  // 設定が無効な場合はデフォルト設定を使用
  const designSettings = settings && Object.keys(settings).length > 0 
    ? settings 
    : getDefaultDesignSettings();
  
  // グローバル設定の取得
  const { 
    mainColor = '#ff6b81', 
    secondaryColor = '#f9f9f9', 
    accentColor = '#41a0ff',
    backgroundColor = '#ffffff',
    fontFamily = 'sans-serif',
    borderRadius = 8,
    maxWidth = 1200,
    hideSectionTitles = false
  } = designSettings.globalSettings || {};

  // セクションは表示順に並べる
  const sortedSections = [...designSettings.sections]
    .sort((a, b) => a.order - b.order)
    .filter(section => section.visible);

  // 店舗情報のデータフォーマットを確認し、安全にアクセスする
  let profile;
  
  // storeProfileデータを適切に解析
  if (storeProfile) {
    console.log('PreviewRenderer: storeProfile型とデータ', {
      type: typeof storeProfile,
      isObject: typeof storeProfile === 'object',
      hasData: !!storeProfile.data,
      keys: storeProfile ? Object.keys(storeProfile) : []
    });
    
    // データがネストされている場合（{ data: {...} }形式）
    if (storeProfile.data) {
      profile = dataUtils.processStoreProfile(storeProfile.data);
      console.log('PreviewRenderer: ネストデータを処理', { 
        dataType: typeof profile, 
        keys: Object.keys(profile)
      });
    } 
    // 直接データが格納されている場合（APIレスポンスによる違い）
    else if (typeof storeProfile === 'object') {
      profile = dataUtils.processStoreProfile(storeProfile);
      console.log('PreviewRenderer: 直接オブジェクトを処理', { 
        keys: Object.keys(profile)
      });
    }
  }
  
  // どの形式でもなければフォールバック
  if (!profile) {
    profile = {
      business_name: '店舗情報が読み込めません',
      catch_phrase: 'プレビュー表示中',
      description: '店舗情報の取得に失敗しました。ページをリロードしてください。',
      service_type: 'エステ',
      location: '東京都',
      access_info: '最寄り駅から徒歩5分',
      business_hours: '10:00〜22:00',
      contact_email: 'contact@example.com',
      benefits: []
    };
  }

  // requirements オブジェクトの安全な取得
  const getRequirements = (): any => {
    if (profile.requirements) {
      if (typeof profile.requirements === 'object' && !Array.isArray(profile.requirements)) {
        return profile.requirements;
      } else if (typeof profile.requirements === 'string') {
        try {
          const parsed = JSON.parse(profile.requirements);
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error('Requirements JSONパースエラー:', e);
        }
      }
    }
    return { accepts_temporary_workers: false };
  };
  
  // 表示用のrequirements
  const requirements = getRequirements();
  
  // セクションIDのマッピング - defaultDesignSettingsのIDからPreviewRendererで使用するIDへ変換
  const sectionIdMapping: Record<string, string> = {
    'header': 'header',                // ヘッダー
    'main_visual': 'main_visual',      // メインビジュアル
    'intro': 'catchphrase',            // 店舗紹介 → キャッチフレーズ
    'benefits': 'benefits',            // 待遇・福利厚生
    'work_environment': 'schedule',    // 働く環境 → スケジュール
    'requirements': 'requirements',    // 応募条件
    'application_info': 'contact',     // 応募情報 → お問い合わせ
    'faq': 'security_measures',        // よくある質問 → セキュリティ対策
    'gallery': 'photo_gallery',        // 写真ギャラリー
    'blog': 'blog',                    // ブログ
    'news': 'access',                  // お知らせ → アクセス
    'campaign': 'special_offers',      // キャンペーン → 特別オファー
    'experience': 'sns_links',         // 体験談 → SNSリンク
    'footer': 'footer'                 // フッター
  };

  // セクションの内容をレンダリングするヘルパー関数
  const renderSectionContent = (section: DesignSection) => {
    // 元のセクションID
    const originalId = section.id;
    // マッピングを適用（マッピングになければ元のID）
    const id = sectionIdMapping[originalId] || originalId;
    
    const { settings: sectionSettings = {} } = section;
    const sectionStyle = {
      backgroundColor: sectionSettings.backgroundColor || '#ffffff',
      color: sectionSettings.textColor || '#333333',
      padding: `${sectionSettings.padding || 20}px`,
      borderRadius: `${sectionSettings.borderRadius || borderRadius}px`,
      border: `${sectionSettings.borderWidth || 1}px solid ${sectionSettings.borderColor || '#e0e0e0'}`,
      fontSize: `${sectionSettings.fontSize || 16}px`,
      marginBottom: '20px'
    };
    
    console.log(`レンダリング: セクション=${originalId}, マッピング=${id}`);

    const titleStyle = {
      color: sectionSettings.titleColor || mainColor,
      fontSize: `${(sectionSettings.fontSize || 16) + 4}px`,
      marginBottom: '15px',
      fontWeight: 'bold' as const
    };

    // セクションタイプに応じてコンテンツをレンダリング
    switch (id) {
      case 'header':
        return (
          <div className="text-center p-4">
            <h1 style={{ fontSize: '28px', color: mainColor, fontWeight: 'bold' }}>
              {profile.business_name}
            </h1>
            <p className="mt-2 text-lg" style={{ color: sectionSettings.textColor || '#666' }}>
              {profile.service_type}
            </p>
          </div>
        );

      case 'main_visual':
        return (
          <div style={{ 
            height: `${sectionSettings.height || 500}px`, 
            position: 'relative',
            backgroundImage: sectionSettings.imageUrl ? `url(${sectionSettings.imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: sectionSettings.backgroundColor || '#f9f9f9'
          }}>
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: sectionSettings.overlayColor || 'rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}>
              <h2 style={{ 
                color: sectionSettings.titleColor || '#ffffff', 
                fontSize: '36px', 
                fontWeight: 'bold',
                marginBottom: '20px',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {sectionSettings.titleText || profile.catch_phrase || '当店の魅力'}
              </h2>
              <p style={{ 
                color: sectionSettings.textColor || '#ffffff',
                fontSize: '18px',
                textAlign: 'center',
                maxWidth: '800px',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                {profile.catch_phrase || '最高の環境で、あなたの可能性を広げませんか？'}
              </p>
            </div>
          </div>
        );
        
      case 'catchphrase':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>お仕事詳細</h2>}
            <div className="mb-4">
              <h3 style={{ fontSize: '22px', color: accentColor, fontWeight: 'bold' }}>
                {profile.catch_phrase || 'お仕事のキャッチフレーズ'}
              </h3>
              <div className="mt-4">
                {profile.description ? (
                  <div dangerouslySetInnerHTML={{ __html: profile.description }} />
                ) : (
                  <p>仕事内容の詳細説明がここに表示されます。</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'photo_gallery':
        // ギャラリー写真を取得
        const galleryPhotos = profile.gallery_photos || [];
        
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>写真ギャラリー</h2>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryPhotos && galleryPhotos.length > 0 ? (
                // ギャラリー写真を順番通りに表示（最大6枚）
                galleryPhotos
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .slice(0, 6)
                  .map((photo: any, index: number) => (
                    <div 
                      key={photo.id || index} 
                      className="overflow-hidden rounded shadow-sm hover:shadow-md transition-shadow"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.title || photo.alt || `店舗写真 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {photo.title && (
                        <div className="p-2 bg-white bg-opacity-90 text-sm text-center border-t">
                          {photo.title}
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                // ダミー画像
                Array.from({ length: 6 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="overflow-hidden rounded bg-gray-200 flex items-center justify-center"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <span className="text-gray-400">写真 {index + 1}</span>
                  </div>
                ))
              )}
            </div>
            {galleryPhotos && galleryPhotos.length > 6 && (
              <div className="mt-4 text-center">
                <button 
                  className="px-4 py-2 rounded-full text-sm font-medium border"
                  style={{ borderColor: mainColor, color: mainColor }}>
                  もっと見る ({galleryPhotos.length - 6}枚)
                </button>
              </div>
            )}
          </div>
        );

      case 'benefits':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>待遇・環境</h2>}
            <ul className="list-disc pl-5 space-y-2">
              {profile.benefits && profile.benefits.length > 0 ? (
                profile.benefits.map((benefit: string, index: number) => (
                  <li key={index}>{benefit}</li>
                ))
              ) : (
                <>
                  <li>未経験者歓迎</li>
                  <li>日払い可能</li>
                  <li>自由出勤</li>
                  <li>寮完備</li>
                </>
              )}
            </ul>
          </div>
        );

      case 'salary':
        // 給与フィールドの処理
        const minGuarantee = profile.minimum_guarantee ? 
          (typeof profile.minimum_guarantee === 'number' ? 
            profile.minimum_guarantee.toLocaleString() : profile.minimum_guarantee) : '';
        
        const maxGuarantee = profile.maximum_guarantee ? 
          (typeof profile.maximum_guarantee === 'number' ? 
            profile.maximum_guarantee.toLocaleString() : profile.maximum_guarantee) : '';
            
        const avgSalary = profile.average_salary ? 
          (typeof profile.average_salary === 'number' ? 
            profile.average_salary.toLocaleString() : profile.average_salary) : '';
            
        // 給与例データの取得と処理
        const rawSalaryExamples = profile.salary_examples && Array.isArray(profile.salary_examples) ? 
          profile.salary_examples : [];
          
        // 給与例データを処理して時給換算情報を追加
        const salaryExamples = rawSalaryExamples.map((example: any) => 
          processSalaryExample(example));
        
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>給与情報</h2>}
            <div className="space-y-4">
              {/* 給与保証情報 */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold mb-2" style={{ color: mainColor }}>給与保証</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 text-sm">最低保証</p>
                    <p className="text-xl font-bold">{minGuarantee ? `${minGuarantee}円` : '要相談'}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm">最高保証</p>
                    <p className="text-xl font-bold">{maxGuarantee ? `${maxGuarantee}円` : '要相談'}</p>
                  </div>
                </div>
                {avgSalary && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-700 text-sm">平均給与</p>
                    <p className="text-xl font-bold">{avgSalary}円</p>
                  </div>
                )}
              </div>
              
              {/* 給与例がある場合 */}
              {salaryExamples.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2" style={{ color: accentColor }}>給与例</h3>
                  <div className="space-y-3">
                    {salaryExamples.map((example: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg border shadow-sm">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{example.title || `給与例 ${index + 1}`}</p>
                              <p className="text-sm text-gray-500">{example.conditions || ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold" style={{ color: mainColor }}>
                                {typeof example.amount === 'number' ? example.amount.toLocaleString() : example.amount}円
                              </p>
                              {example.period && <p className="text-xs text-gray-500">{example.period}</p>}
                            </div>
                          </div>
                          
                          {/* 勤務時間と時給換算情報を表示 */}
                          {example.formatted && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">{example.formatted}</p>
                                {example.hourlyFormatted && (
                                  <p className="text-sm font-medium text-green-600">{example.hourlyFormatted}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'schedule':
        // 勤務時間関連の情報を処理
        const workingHours = profile.working_hours || {};
        const workingTimeHours = profile.working_time_hours || '';
        
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>勤務時間</h2>}
            <div className="space-y-4">
              {/* 勤務時間 */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold mb-3" style={{ color: mainColor }}>営業・勤務時間</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">営業時間</p>
                    <p className="text-lg">{profile.business_hours || '10:00〜22:00'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-700 text-sm font-medium">1日の勤務時間</p>
                    <p className="text-lg">{workingTimeHours || '6〜8時間程度'}</p>
                  </div>
                </div>
                
                {/* シフト情報 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-700 text-sm font-medium">シフト体制</p>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {workingHours.system || profile.shift_system || '自由出勤制'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* 曜日シフト表示 */}
                    {workingHours.days_available && Array.isArray(workingHours.days_available) && workingHours.days_available.length > 0 ? (
                      <div className="w-full grid grid-cols-7 gap-1 text-center">
                        {['月', '火', '水', '木', '金', '土', '日'].map((day, idx) => {
                          const isAvailable = workingHours.days_available.includes(day) || 
                                            workingHours.days_available.includes(idx) || 
                                            workingHours.days_available.includes(idx.toString());
                          return (
                            <div 
                              key={day} 
                              className={`p-2 rounded ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  
                  {/* 休日情報 */}
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm font-medium">休日</p>
                    <p>{profile.holidays || workingHours.holidays || '自由（週1日以上の出勤をお願いしています）'}</p>
                  </div>
                  
                  {/* 勤務開始日 */}
                  {workingHours.start_date && (
                    <div className="mt-3">
                      <p className="text-gray-700 text-sm font-medium">勤務開始可能日</p>
                      <p>{workingHours.start_date}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 勤務条件等の補足情報 */}
              {requirements && requirements.accepts_temporary_workers && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-amber-700 font-bold">出稼ぎ情報</h4>
                  <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
                    <li>出稼ぎ歓迎</li>
                    {requirements.requires_arrival_day_before && (
                      <li>前日入りをお願いします</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 'special_offers':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>特別オファー</h2>}
            <div className="bg-opacity-10" style={{ backgroundColor: `${accentColor}20`, padding: '15px', borderRadius: '8px' }}>
              {profile.special_offers && profile.special_offers.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {profile.special_offers.map((offer: any, index: number) => (
                    <li key={index}>
                      {typeof offer === 'object' ? (
                        <>
                          <strong className="text-lg" style={{ color: mainColor }}>
                            {offer.title || '特別オファー'}
                          </strong>
                          {offer.description && (
                            <p className="mt-1">{offer.description}</p>
                          )}
                          {offer.expire_date && (
                            <p className="text-sm mt-1 font-italic">
                              期限: {new Date(offer.expire_date).toLocaleDateString('ja-JP')} まで
                            </p>
                          )}
                        </>
                      ) : (
                        <span>{offer}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p className="font-bold" style={{ color: mainColor }}>期間限定キャンペーン実施中!</p>
                  <p className="mt-2">入店祝い金最大10万円プレゼント</p>
                  <p className="text-sm mt-2 italic">※詳細は面接時にご説明いたします</p>
                </div>
              )}
              
              {/* 求人手当や交通費サポートなどの情報 */}
              {profile.transportation_support && (
                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded">
                  <p className="font-semibold">交通費サポート</p>
                  <p>{profile.transportation_support}</p>
                </div>
              )}
              
              {/* 住居サポート情報 */}
              {profile.housing_support && (
                <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
                  <p className="font-semibold">住居サポート</p>
                  <p>{profile.housing_support}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'access':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>アクセス情報</h2>}
            <div className="space-y-2">
              <p>
                <strong>所在地:</strong> {profile.location || '東京都新宿区'}
              </p>
              <p>
                <strong>アクセス:</strong> {profile.access_info || '最寄り駅から徒歩5分'}
              </p>
              <div className="mt-4 bg-gray-200 h-48 flex items-center justify-center">
                <span className="text-gray-500">地図がここに表示されます</span>
              </div>
            </div>
          </div>
        );

      case 'contact':
        // 複数の電話番号とメールアドレスをサポート
        const phoneNumbers = Array.isArray(profile.phone_numbers) ? profile.phone_numbers : 
          (profile.phone_numbers ? [profile.phone_numbers] : []);
        
        const emailAddresses = Array.isArray(profile.email_addresses) ? profile.email_addresses :
          (profile.email_addresses ? [profile.email_addresses] : []);
          
        // フォールバックオプション
        if (profile.contact_phone && phoneNumbers.length === 0) {
          phoneNumbers.push(profile.contact_phone);
        }
        
        if (profile.contact_email && emailAddresses.length === 0) {
          emailAddresses.push(profile.contact_email);
        }
          
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>お問い合わせ</h2>}
            <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-100">
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-3" style={{ color: mainColor }}>
                  お気軽にお問い合わせください
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  求人に関するご質問や面接のご予約など、お気軽にお問い合わせください。
                  24時間体制でスタッフが対応いたします。
                </p>
              </div>
              
              {/* 電話番号 */}
              <div className="mb-4">
                <h4 className="font-semibold flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" style={{ color: accentColor }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  電話番号
                </h4>
                
                {phoneNumbers.length > 0 ? (
                  <div className="space-y-2">
                    {phoneNumbers.map((phone, index) => (
                      <div key={index} className="flex items-center">
                        <a href={`tel:${phone}`} className="text-lg font-bold" style={{ color: mainColor }}>
                          {phone}
                        </a>
                        {index === 0 && <span className="ml-2 text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">採用担当直通</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg font-bold" style={{ color: mainColor }}>03-xxxx-xxxx</p>
                )}
                
                <p className="text-sm text-gray-500 mt-1">
                  受付時間: {profile.contact_hours || '10:00〜20:00（年中無休）'}
                </p>
              </div>
              
              {/* メールアドレス */}
              <div className="mb-4">
                <h4 className="font-semibold flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" style={{ color: accentColor }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  メールアドレス
                </h4>
                
                {emailAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {emailAddresses.map((email, index) => (
                      <div key={index}>
                        <a href={`mailto:${email}`} className="text-md font-semibold" style={{ color: mainColor }}>
                          {email}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-md font-semibold" style={{ color: mainColor }}>contact@example.com</p>
                )}
                
                <p className="text-sm text-gray-500 mt-1">
                  24時間受付中・お返事は営業時間内となります
                </p>
              </div>
              
              {/* 応募ボタン */}
              <div className="mt-5">
                <button 
                  className="w-full py-3 rounded-lg font-bold text-white text-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  今すぐ応募する
                </button>
              </div>
            </div>
          </div>
        );

      case 'sns_links':
        // LINE情報や個別のSNS情報を統合して表示
        const hasSnsId = !!profile.sns_id;
        const hasSnsUrl = !!profile.sns_url;
        const hasSnsText = !!profile.sns_text;
        const hasLineSetting = hasSnsId || hasSnsUrl || hasSnsText;
        
        // SNSリンク配列またはLINE情報のどちらかがある場合に表示
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>SNS</h2>}
            
            {/* LINE情報がある場合 */}
            {hasLineSetting && (
              <div className="mb-5 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-3">
                  <div className="bg-green-500 text-white p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg">LINE公式アカウント</h3>
                </div>
                
                {profile.sns_text && (
                  <p className="mb-3">{profile.sns_text}</p>
                )}
                
                {profile.sns_id && (
                  <div className="flex items-center mb-2">
                    <span className="font-semibold mr-2">LINE ID:</span>
                    <span className="bg-white px-2 py-1 rounded border">{profile.sns_id}</span>
                  </div>
                )}
                
                {profile.sns_url && (
                  <div className="mt-3">
                    <a 
                      href={profile.sns_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                      <span className="mr-2">LINEで友だち追加</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* その他SNSリンク */}
            <div className="flex flex-wrap gap-4">
              {profile.sns_links && profile.sns_links.length > 0 ? (
                profile.sns_links.map((sns: any, index: number) => (
                  <div key={index} className="text-center">
                    <a 
                      href={sns.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block p-3 rounded-full"
                      style={{ backgroundColor: mainColor, color: 'white' }}
                    >
                      {typeof sns === 'object' ? (sns.platform || sns.name || 'SNS') : sns}
                    </a>
                    <p className="mt-1 text-sm">
                      {typeof sns === 'object' ? (sns.platform || sns.name || 'SNS') : sns}
                    </p>
                  </div>
                ))
              ) : !hasLineSetting && (
                <>
                  <div className="text-center">
                    <span
                      className="inline-block p-3 rounded-full"
                      style={{ backgroundColor: mainColor, color: 'white' }}
                    >
                      Twitter
                    </span>
                    <p className="mt-1 text-sm">Twitter</p>
                  </div>
                  <div className="text-center">
                    <span
                      className="inline-block p-3 rounded-full"
                      style={{ backgroundColor: mainColor, color: 'white' }}
                    >
                      Instagram
                    </span>
                    <p className="mt-1 text-sm">Instagram</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'security_measures':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>安全対策</h2>}
            <div>
              {profile.security_measures && profile.security_measures.length > 0 ? (
                <div className="space-y-4">
                  {profile.security_measures.map((measure: any, index: number) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 p-3 rounded border-l-4" 
                      style={{ borderLeftColor: mainColor }}
                    >
                      {typeof measure === 'object' ? (
                        <>
                          <h3 className="font-bold mb-2" style={{ color: mainColor }}>
                            {measure.title || '安全対策'}
                          </h3>
                          {measure.description && (
                            <p className="text-sm text-gray-700">{measure.description}</p>
                          )}
                          {measure.category && (
                            <span className="inline-block text-xs bg-gray-200 rounded-full px-2 py-1 mt-2">
                              {measure.category === 'other' ? '一般' : 
                               measure.category === 'face' ? '顔出し関連' : 
                               measure.category === 'emergency' ? '緊急時対応' : 
                               measure.category === 'data' ? '個人情報' : 
                               measure.category === 'location' ? '所在地関連' : 
                               measure.category}
                            </span>
                          )}
                        </>
                      ) : (
                        <p>{measure}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <div className="bg-gray-50 p-3 rounded border-l-4" style={{ borderLeftColor: mainColor }}>
                    <h3 className="font-bold" style={{ color: mainColor }}>定期的な健康チェック</h3>
                    <p className="text-sm text-gray-700">スタッフの健康管理を徹底しています</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border-l-4" style={{ borderLeftColor: mainColor }}>
                    <h3 className="font-bold" style={{ color: mainColor }}>安全対策研修</h3>
                    <p className="text-sm text-gray-700">全スタッフに対して定期的に実施しています</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border-l-4" style={{ borderLeftColor: mainColor }}>
                    <h3 className="font-bold" style={{ color: mainColor }}>警備スタッフ常駐</h3>
                    <p className="text-sm text-gray-700">24時間体制でセキュリティを確保</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border-l-4" style={{ borderLeftColor: mainColor }}>
                    <h3 className="font-bold" style={{ color: mainColor }}>24時間サポート体制</h3>
                    <p className="text-sm text-gray-700">いつでも相談できる窓口を用意しています</p>
                  </div>
                </div>
              )}
              
              {/* プライバシー対策の表示 */}
              {profile.privacy_measures && profile.privacy_measures.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-bold mb-3" style={{ color: accentColor }}>プライバシー保護対策</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {Array.isArray(profile.privacy_measures) && profile.privacy_measures.map((measure: any, index: number) => (
                      <li key={index} className="text-sm">
                        {typeof measure === 'object' ? measure.title || measure.description || JSON.stringify(measure) : measure}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* コミットメント（約束事項）の表示 */}
              {profile.commitment && (
                <div className="mt-5 p-4 bg-white border rounded-lg shadow-sm">
                  <h3 className="font-bold mb-2 text-lg" style={{ color: accentColor }}>当店のお約束</h3>
                  {typeof profile.commitment === 'string' ? (
                    <div className="prose max-w-none">
                      <p>{profile.commitment}</p>
                    </div>
                  ) : Array.isArray(profile.commitment) ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {profile.commitment.map((item: any, index: number) => (
                        <li key={index} className="text-sm">
                          {typeof item === 'object' ? item.text || JSON.stringify(item) : item}
                        </li>
                      ))}
                    </ul>
                  ) : typeof profile.commitment === 'object' ? (
                    <div className="prose max-w-none">
                      <p>{JSON.stringify(profile.commitment)}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>応募条件</h2>}
            <div>
              <ul className="list-disc pl-5 space-y-2">
                {/* 年齢条件 */}
                <li>
                  {requirements.age_min ? `${requirements.age_min}歳以上` : '18歳以上'}（高校生不可）
                </li>
                
                {/* 出稼ぎ受け入れ可能な場合 */}
                {requirements.accepts_temporary_workers && (
                  <li className="font-bold text-green-600">出稼ぎ可能</li>
                )}
                
                {/* 出稼ぎの場合は前日入りが必要か */}
                {requirements.accepts_temporary_workers && requirements.requires_arrival_day_before && (
                  <li>出稼ぎの場合は前日入りをお願いします</li>
                )}
                
                {/* タトゥー条件 */}
                {requirements.tattoo_acceptance && (
                  <li>タトゥー: {requirements.tattoo_acceptance}</li>
                )}
                
                {/* 希望ルックス */}
                {requirements.preferred_look_types && requirements.preferred_look_types.length > 0 && (
                  <li>
                    希望ルックス: {Array.isArray(requirements.preferred_look_types) 
                      ? requirements.preferred_look_types.join('、') 
                      : requirements.preferred_look_types}
                  </li>
                )}
                
                {/* 希望髪色 */}
                {requirements.preferred_hair_colors && requirements.preferred_hair_colors.length > 0 && (
                  <li>
                    希望髪色: {Array.isArray(requirements.preferred_hair_colors) 
                      ? requirements.preferred_hair_colors.join('、') 
                      : requirements.preferred_hair_colors}
                  </li>
                )}
                
                {/* その他の条件 */}
                {requirements.other_conditions && requirements.other_conditions.length > 0 && 
                  Array.isArray(requirements.other_conditions) && 
                  requirements.other_conditions.map((condition: string, index: number) => (
                    <li key={`other-condition-${index}`}>{condition}</li>
                  ))
                }
                
                {/* 標準的な条件 */}
                <li>未経験者歓迎</li>
                <li>日本語でのコミュニケーションが可能な方</li>
              </ul>
            </div>
          </div>
        );

      case 'blog':
        // ブログ記事のデータ取得
        // プロフィールデータから直接取得またはAPIデータを使用
        let blogPostsData: any[] = [];
        
        // blogPosts プロパティが直接ある場合
        if (profile.blog_posts && Array.isArray(profile.blog_posts) && profile.blog_posts.length > 0) {
          blogPostsData = profile.blog_posts;
        } 
        // JSON文字列の場合をパース
        else if (typeof profile.blog_posts === 'string') {
          try {
            const parsed = JSON.parse(profile.blog_posts);
            if (Array.isArray(parsed)) {
              blogPostsData = parsed;
            }
          } catch (e) {
            console.log("ブログ記事のJSONパースに失敗:", e);
          }
        }
        
        // 日付フォーマッター
        const formatDate = (dateString: string) => {
          try {
            return new Date(dateString).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch (e) {
            return '日付なし';
          }
        };
        
        // コンテンツの安全な表示
        const safeContent = (content: string, maxLength: number = 150) => {
          if (!content) return '記事の内容がありません';
          
          try {
            // HTMLタグを取り除いてプレーンテキスト化
            const plainText = content.replace(/<[^>]*>/g, ' ');
            
            if (plainText.length > maxLength) {
              return plainText.substring(0, maxLength) + '...';
            }
            return plainText;
          } catch (e) {
            return content.substring(0, maxLength);
          }
        };
        
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>店舗ブログ</h2>}
            <div className="grid grid-cols-1 gap-6">
              {blogPostsData.length > 0 ? (
                blogPostsData.slice(0, 3).map((post: any, index: number) => (
                  <div key={index} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
                    <div className="flex flex-col md:flex-row md:items-start">
                      {/* サムネイル画像 */}
                      {post.thumbnail ? (
                        <div className="md:w-1/3 mb-4 md:mb-0 md:mr-4">
                          <div className="h-48 overflow-hidden rounded">
                            <img 
                              src={post.thumbnail} 
                              alt={post.title || "ブログ画像"} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.jp/30/dddddd/ffffff/300x200.png?text=No+Image';
                              }}
                            />
                          </div>
                        </div>
                      ) : post.images && Array.isArray(post.images) && post.images.length > 0 ? (
                        <div className="md:w-1/3 mb-4 md:mb-0 md:mr-4">
                          <div className="h-48 overflow-hidden rounded">
                            <img 
                              src={post.images[0].url || post.images[0]} 
                              alt={post.title || "ブログ画像"} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.jp/30/dddddd/ffffff/300x200.png?text=No+Image';
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="md:w-1/3 mb-4 md:mb-0 md:mr-4">
                          <div className="h-48 bg-gray-100 flex items-center justify-center rounded">
                            <span className="text-gray-400">画像なし</span>
                          </div>
                        </div>
                      )}
                      
                      {/* ブログコンテンツ */}
                      <div className="md:w-2/3">
                        <div className="mb-3">
                          <h3 className="font-bold text-xl" style={{ color: mainColor }}>
                            {post.title || "新しいブログ記事"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {post.published_at ? formatDate(post.published_at) : 
                             post.created_at ? formatDate(post.created_at) : 
                             '2025年3月' + (index + 1) + '日'}
                          </p>
                        </div>
                        
                        {/* コンテンツプレビュー */}
                        <div className="prose prose-sm">
                          {post.content ? (
                            <p className="text-gray-700">{safeContent(post.content)}</p>
                          ) : (
                            <p className="text-gray-500 italic">記事の内容がありません。</p>
                          )}
                        </div>
                        
                        {/* 続きを読むボタン */}
                        <div className="mt-4 flex justify-end">
                          <a 
                            href={`/store/blog/${post.id}`}
                            className="text-sm font-medium flex items-center" 
                            style={{ color: accentColor }}>
                            続きを読む
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 ml-1" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M13 7l5 5m0 0l-5 5m5-5H6" 
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="text-5xl mb-4" style={{ color: accentColor }}>📝</div>
                  <h3 className="text-lg font-semibold mb-2">ブログ記事はまだありません</h3>
                  <p className="text-gray-600">
                    最新情報やスタッフの紹介など、定期的にブログを更新していきます。<br />
                    また後日チェックしてください。
                  </p>
                </div>
              )}
            </div>
            
            {blogPostsData.length > 0 && (
              <div className="mt-6 text-center">
                <a 
                  href="/store/blog"
                  className="inline-block px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ 
                    color: 'white', 
                    backgroundColor: mainColor,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                  すべてのブログ記事を見る
                </a>
              </div>
            )}
          </div>
        );
        
      case 'footer':
        return (
          <div style={{ 
            backgroundColor: sectionSettings.backgroundColor || '#333333',
            color: sectionSettings.textColor || '#ffffff',
            padding: '30px 20px',
            marginTop: '40px'
          }}>
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h3 className="text-lg font-bold mb-4" style={{ color: sectionSettings.accentColor || mainColor }}>
                    {profile.business_name}
                  </h3>
                  <p className="text-sm">
                    {profile.location}<br />
                    {profile.access_info}
                  </p>
                </div>
                
                <div className="mb-6 md:mb-0">
                  <h4 className="text-md font-bold mb-3" style={{ color: sectionSettings.accentColor || mainColor }}>
                    お問い合わせ
                  </h4>
                  <ul className="text-sm">
                    <li className="mb-2">TEL: {profile.contact_phone || '03-xxxx-xxxx'}</li>
                    <li>MAIL: {profile.contact_email || 'contact@example.com'}</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-bold mb-3" style={{ color: sectionSettings.accentColor || mainColor }}>
                    営業情報
                  </h4>
                  <ul className="text-sm">
                    <li className="mb-2">営業時間: {profile.business_hours || '10:00〜22:00'}</li>
                    <li>定休日: {profile.holidays || '年中無休'}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-600 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} {profile.business_name} All Rights Reserved.</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>{section.title || `セクション: ${id}`}</h2>}
            <div className="italic text-gray-500">
              このセクションの内容はプレビューできません
            </div>
          </div>
        );
    }
  };

  // グローバルスタイル
  const globalStyle = {
    fontFamily,
    backgroundColor,
    color: '#333333',
    maxWidth: deviceView === 'pc' ? `${maxWidth}px` : '100%',
    margin: '0 auto',
    padding: deviceView === 'pc' ? '30px' : '15px'
  };

  return (
    <div style={globalStyle} className="preview-container">
      {/* 店舗ページコンテンツ */}
      <div className="space-y-6">
        {sortedSections.map((section) => (
          <div key={section.id} style={section.settings}>
            {renderSectionContent(section)}
          </div>
        ))}

        {/* 応募ボタン */}
        <div className="mt-8 text-center">
          <button
            style={{
              backgroundColor: mainColor,
              color: 'white',
              padding: '12px 30px',
              borderRadius: `${borderRadius}px`,
              fontWeight: 'bold',
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            応募する
          </button>
        </div>

        {/* フッター */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-500">
          <p>© 2025 {profile.business_name || '店舗名'} All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PreviewRenderer;