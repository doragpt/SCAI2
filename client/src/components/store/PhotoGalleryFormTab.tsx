import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoGalleryEditor } from './PhotoGalleryEditor';
import { Control, useWatch } from 'react-hook-form';
import { StoreProfileFormData } from '@shared/schema';

interface PhotoGalleryFormTabProps {
  control: Control<StoreProfileFormData>;
  setValue: any;
}

export function PhotoGalleryFormTab({ control, setValue }: PhotoGalleryFormTabProps) {
  // フォームからフォトギャラリーの値を監視
  const galleryPhotos = useWatch({
    control,
    name: 'gallery_photos',
    defaultValue: [],
  });

  // フォトギャラリーの更新
  const handleGalleryPhotosChange = (newPhotos: any[]) => {
    // 新しい写真がnullまたは未定義の場合は処理しない
    if (!newPhotos) {
      console.error('PhotoGalleryFormTab: 写真が提供されていません');
      return;
    }
    
    console.log('PhotoGalleryFormTab: 写真更新', {
      現在のデータ: galleryPhotos ? galleryPhotos.length : 0,
      新しいデータ: newPhotos.length
    });
    
    try {
      // 完全な新しい配列を作成して、参照の問題を避ける
      const processedPhotos = newPhotos.map(photo => {
        if (!photo) {
          console.error('無効な写真オブジェクト:', photo);
          return null;
        }
        
        // 必須のidフィールドを確実に持つようにする
        return {
          ...photo,
          id: photo.id || `photo-${Math.random().toString(36).substr(2, 9)}`
        };
      }).filter(Boolean); // nullや未定義の項目を除外
      
      setValue('gallery_photos', processedPhotos, { 
        shouldDirty: true,
        shouldValidate: true
      });
    } catch (error) {
      console.error('PhotoGalleryFormTab: 写真処理エラー', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>フォトギャラリー</CardTitle>
          <CardDescription>
            店内、個室、待機所などの写真を追加して、お店の雰囲気をアピールしましょう。
            推奨サイズは 200 × 150 px です。写真は全て表示時このサイズに固定されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoGalleryEditor
            photos={galleryPhotos || []}
            onChange={handleGalleryPhotosChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}