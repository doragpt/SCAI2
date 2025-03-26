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
    setValue('gallery_photos', newPhotos, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>フォトギャラリー</CardTitle>
          <CardDescription>
            店内、個室、待機所などの写真を追加して、お店の雰囲気をアピールしましょう。
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