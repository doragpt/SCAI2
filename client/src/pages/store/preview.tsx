import React from 'react';
import { HtmlContent } from '@/components/html-content';
import { type StoreProfile } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { PhotoGalleryDisplay } from '@/components/store/PhotoGalleryDisplay';
import { 
  Building2, Clock, MapPin, Phone, Mail, BadgeCheck, 
  Image, User, DollarSign, Info, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// よりシンプル化したプレビュー表示用コンポーネント
export default function StorePreview() {
  // 店舗データを取得
  const { data: profile, isLoading } = useQuery<StoreProfile>({
    queryKey: [QUERY_KEYS.STORE_PROFILE],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/store/profile');
      return response as StoreProfile;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
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

  return (
    <div className="bg-white min-h-screen">
      {/* ナビゲーションバー */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.href = '/store/dashboard'} 
            className="mr-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
          <span className="font-bold">プレビュー画面</span>
        </div>
      </div>

      {/* シンプルなプレビューヘッダー */}
      <header className="bg-gray-50 py-6 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">{profile.business_name || 'テスト店舗'}</h1>
          <div className="flex items-center mt-2 text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="mr-3">{profile.location}</span>
            <span className="px-2 py-0.5 bg-gray-200 rounded text-sm">{profile.service_type}</span>
          </div>
        </div>
      </header>

      {/* シンプルなメインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 注意書き */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-sm text-blue-700">
            <Info className="h-4 w-4 inline mr-2" />
            これはプレビュー画面です。実際の公開ページのデザインとは異なります。
          </p>
        </div>

        {/* キャッチコピー */}
        {profile.catch_phrase && (
          <div className="mb-8 text-center p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">『{profile.catch_phrase}』</h2>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左側カラム */}
          <div className="space-y-6">
            {/* 店舗情報 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-gray-700" />
                店舗情報
              </h3>
              
              {profile.description && (
                <div className="prose max-w-none">
                  <HtmlContent html={profile.description} />
                </div>
              )}
            </section>

            {/* 給与情報 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-gray-700" />
                給与情報
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-600">日給</h4>
                  <p className="text-lg">
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
                    <h4 className="font-medium text-gray-600">平均時給</h4>
                    <p>{Math.round(profile.average_hourly_pay / profile.working_time_hours).toLocaleString()}円</p>
                  </div>
                )}
              </div>
            </section>

            {/* 勤務時間 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-700" />
                勤務時間
              </h3>
              <p>{profile.working_hours || '勤務時間が設定されていません'}</p>
            </section>

            {/* フォトギャラリー */}
            {profile.gallery_photos && profile.gallery_photos.length > 0 && (
              <section className="border rounded-md p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Image className="h-5 w-5 mr-2 text-gray-700" />
                  フォトギャラリー
                </h3>
                <PhotoGalleryDisplay photos={profile.gallery_photos} />
              </section>
            )}
          </div>

          {/* 右側カラム */}
          <div className="space-y-6">
            {/* 応募条件 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-700" />
                応募条件
              </h3>
              
              {profile.requirements ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-600">年齢</h4>
                    <p>{profile.requirements.age_min || 18}歳以上
                      {profile.requirements.age_max ? `${profile.requirements.age_max}歳以下` : ''}
                    </p>
                  </div>
                  
                  {profile.requirements.cup_size_conditions && 
                   profile.requirements.cup_size_conditions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-600">カップサイズ条件</h4>
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
                      <h4 className="font-medium text-gray-600">その他の条件</h4>
                      <p>{profile.application_requirements}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">応募条件が設定されていません</p>
              )}
            </section>

            {/* 待遇・環境 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <BadgeCheck className="h-5 w-5 mr-2 text-gray-700" />
                待遇・環境
              </h3>
              
              {profile.benefits && profile.benefits.length > 0 ? (
                <ul className="grid grid-cols-1 gap-2">
                  {profile.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <BadgeCheck className="h-4 w-4 mr-2 text-green-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">待遇情報がまだ登録されていません</p>
              )}
            </section>

            {/* アクセス・住所 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-700" />
                アクセス・住所
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-600">エリア</h4>
                  <p>{profile.location}</p>
                </div>
                
                {profile.address && (
                  <div>
                    <h4 className="font-medium text-gray-600">住所</h4>
                    <p>{profile.address}</p>
                  </div>
                )}
                
                {profile.access_info && (
                  <div>
                    <h4 className="font-medium text-gray-600">アクセス</h4>
                    <p>{profile.access_info}</p>
                  </div>
                )}
              </div>
            </section>

            {/* 連絡先 */}
            <section className="border rounded-md p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-gray-700" />
                連絡先
              </h3>
              
              <div className="space-y-3">
                {profile.recruiter_name && (
                  <div>
                    <h4 className="font-medium text-gray-600">担当者</h4>
                    <p>{profile.recruiter_name}</p>
                  </div>
                )}
                
                {profile.phone_numbers && profile.phone_numbers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-600">電話番号</h4>
                    <ul className="space-y-1">
                      {profile.phone_numbers.map((phone, index) => (
                        <li key={index} className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{phone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profile.email_addresses && profile.email_addresses.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-600">メールアドレス</h4>
                    <ul className="space-y-1">
                      {profile.email_addresses.map((email, index) => (
                        <li key={index} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* シンプルなフッター */}
      <footer className="border-t bg-gray-50 mt-8 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>このプレビューは管理用です。実際の公開ページとは異なります。</p>
        </div>
      </footer>
    </div>
  );
}