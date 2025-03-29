import React from 'react';
import { getDefaultDesignSettings } from '@/shared/defaultDesignSettings';
import { type DesignSettings, type DesignSection } from '@shared/schema';
import { dataUtils } from '@/shared/utils/dataTypeUtils';

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
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>給与情報</h2>}
            <div className="space-y-2">
              <p>
                <strong>給与体系:</strong> {profile.salary_system || '日払い制'}
              </p>
              <p>
                <strong>給与目安:</strong> {profile.salary_range || '日給35,000円〜80,000円'}
              </p>
              <p>
                <strong>ボーナス:</strong> {profile.bonus_system || 'あり（業績による）'}
              </p>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>勤務時間</h2>}
            <div className="space-y-2">
              <p>
                <strong>営業時間:</strong> {profile.business_hours || '10:00〜22:00'}
              </p>
              <p>
                <strong>シフト:</strong> {profile.shift_system || '自由出勤制'}
              </p>
              <p>
                <strong>休日:</strong> {profile.holidays || '自由（週1日以上の出勤をお願いしています）'}
              </p>
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
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>お問い合わせ</h2>}
            <div className="space-y-2">
              <p>
                <strong>メール:</strong> {profile.contact_email || 'contact@example.com'}
              </p>
              <p>
                <strong>電話:</strong> {profile.contact_phone || '03-xxxx-xxxx'}
              </p>
              <p>
                <strong>受付時間:</strong> {profile.contact_hours || '10:00〜20:00（年中無休）'}
              </p>
            </div>
          </div>
        );

      case 'sns_links':
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>SNS</h2>}
            <div className="flex gap-4">
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
                      {sns.platform}
                    </a>
                    <p className="mt-1 text-sm">{sns.platform}</p>
                  </div>
                ))
              ) : (
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
        // ブログ記事を直接取得 (将来的には blog_posts APIから取得することもできる)
        const blogPosts = profile.blog_posts || [];
        
        return (
          <div>
            {!hideSectionTitles && <h2 style={titleStyle}>店舗ブログ</h2>}
            <div className="grid grid-cols-1 gap-4">
              {blogPosts && blogPosts.length > 0 ? (
                blogPosts.slice(0, 3).map((post: any, index: number) => (
                  <div key={index} className="border p-3 rounded shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{post.title || "無題のブログ"}</h3>
                      {post.published_at && (
                        <p className="text-sm text-gray-500">
                          {new Date(post.published_at).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                    {post.thumbnail && (
                      <div className="my-3 h-32 overflow-hidden rounded">
                        <img 
                          src={post.thumbnail} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="mt-2 line-clamp-3 text-sm overflow-hidden" 
                         style={{ maxHeight: "4.5rem" }}>
                      {/* HTMLコンテンツからプレーンテキストを抽出 */}
                      {post.content ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: post.content.length > 150 
                            ? post.content.substring(0, 150) + '...' 
                            : post.content 
                        }} />
                      ) : (
                        <p>記事の内容がありません</p>
                      )}
                    </div>
                    <div className="mt-3 text-right">
                      <button 
                        className="text-sm font-medium" 
                        style={{ color: accentColor }}>
                        続きを読む
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border p-3 rounded shadow-sm">
                    <h3 className="font-bold">ブログタイトル {index + 1}</h3>
                    <p className="text-sm text-gray-500">2025年3月{index + 1}日</p>
                    <div className="mt-2 bg-gray-100 h-24 rounded flex items-center justify-center">
                      <span className="text-gray-400">ブログ画像</span>
                    </div>
                    <p className="mt-2">これはブログ記事のサンプルテキストです。実際の記事はデータベースから取得されます。</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 text-center">
              <button 
                className="px-4 py-2 rounded text-sm font-medium"
                style={{ color: 'white', backgroundColor: mainColor }}>
                すべてのブログ記事を見る
              </button>
            </div>
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