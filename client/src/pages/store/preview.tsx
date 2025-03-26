import React from 'react';
import { HtmlContent } from '@/components/html-content';
import { type StoreProfile } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { PhotoGalleryDisplay } from '@/components/store/PhotoGalleryDisplay';
import { 
  Building2, Clock, MapPin, Phone, Mail, BadgeCheck, Shield, 
  Image, Info, User, DollarSign 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// シンプル化したプレビュー表示用コンポーネント
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

  return (
    <div className="bg-background min-h-screen">
      {/* ヘッダー */}
      <header className="bg-primary text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">{profile.business_name || 'テスト店舗'}</h1>
          <p className="text-sm opacity-80">
            {profile.location} | {profile.service_type}
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          
          {/* 基本情報セクション */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <Info className="mr-2 h-5 w-5" />
                店舗情報
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">{profile.catch_phrase}</h2>
                </div>
                
                {profile.description && (
                  <div className="mt-4">
                    <HtmlContent html={profile.description} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 給与情報 */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <DollarSign className="mr-2 h-5 w-5" />
                給与情報
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">日給保証</h3>
                  <p>
                    {profile.minimum_guarantee ? 
                      `${profile.minimum_guarantee.toLocaleString()}円〜` : '未設定'}
                    {profile.maximum_guarantee ? 
                      `${profile.maximum_guarantee.toLocaleString()}円` : ''}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">時給目安</h3>
                  <p>
                    {profile.average_hourly_pay ? 
                      `平均 ${profile.average_hourly_pay.toLocaleString()}円` : '未設定'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 応募条件 */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <User className="mr-2 h-5 w-5" />
                応募条件
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {profile.requirements ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-2">年齢</h3>
                      <p>{profile.requirements.age_min || 18}歳以上
                        {profile.requirements.age_max ? `${profile.requirements.age_max}歳以下` : ''}
                      </p>
                    </div>
                    
                    {profile.requirements.cup_size_conditions && 
                     profile.requirements.cup_size_conditions.length > 0 && (
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
                </div>
              ) : (
                <p>応募条件が設定されていません</p>
              )}
            </CardContent>
          </Card>

          {/* 勤務時間 */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <Clock className="mr-2 h-5 w-5" />
                勤務時間
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p>{profile.working_hours || '勤務時間が設定されていません'}</p>
            </CardContent>
          </Card>

          {/* 待遇・環境 */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <BadgeCheck className="mr-2 h-5 w-5" />
                待遇・環境
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {profile.benefits && profile.benefits.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <BadgeCheck className="h-5 w-5 mr-2 text-primary" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>待遇情報がまだ登録されていません</p>
              )}
            </CardContent>
          </Card>

          {/* アクセス・住所 */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <MapPin className="mr-2 h-5 w-5" />
                アクセス・住所
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">エリア</h3>
                  <p>{profile.location}</p>
                </div>
                
                {profile.address && (
                  <div>
                    <h3 className="font-semibold mb-2">住所</h3>
                    <p>{profile.address}</p>
                  </div>
                )}
                
                {profile.access_info && (
                  <div>
                    <h3 className="font-semibold mb-2">アクセス</h3>
                    <p>{profile.access_info}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 連絡先 */}
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center text-xl">
                <Phone className="mr-2 h-5 w-5" />
                連絡先
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {profile.recruiter_name && (
                  <div>
                    <h3 className="font-semibold mb-2">担当者</h3>
                    <p>{profile.recruiter_name}</p>
                  </div>
                )}
                
                {profile.phone_numbers && profile.phone_numbers.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">電話番号</h3>
                    <ul className="space-y-1">
                      {profile.phone_numbers.map((phone, index) => (
                        <li key={index} className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-primary" />
                          <span>{phone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profile.email_addresses && profile.email_addresses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">メールアドレス</h3>
                    <ul className="space-y-1">
                      {profile.email_addresses.map((email, index) => (
                        <li key={index} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-primary" />
                          <span>{email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* フォトギャラリー */}
          {profile.gallery_photos && profile.gallery_photos.length > 0 && (
            <Card className="overflow-hidden shadow-md">
              <CardHeader className="bg-primary/10">
                <CardTitle className="flex items-center text-xl">
                  <Image className="mr-2 h-5 w-5" />
                  フォトギャラリー
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <PhotoGalleryDisplay photos={profile.gallery_photos} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4">
          <p className="text-center">&copy; 2025 {profile.business_name || 'テスト店舗'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}