import React, { useEffect, useState } from 'react';
import { getSignedPhotoUrl } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface ThumbnailImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * 署名付きURLを使用する画像コンポーネント
 * S3の署名付きURLは有効期限があるため、必要に応じて新しいURLを取得します
 */
export function ThumbnailImage({ src, alt, className, ...props }: ThumbnailImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // srcが変更されたら状態をリセット
    setImageSrc(src);
    setError(null);
  }, [src]);

  // S3のキーを抽出する関数
  const extractS3Key = (url: string): string | null => {
    try {
      // 画像URLからS3のキーを抽出
      // 例: https://bucket.s3.region.amazonaws.com/filename.jpg?...
      // からfilename.jpgを抽出
      
      // URLオブジェクトを作成
      const urlObj = new URL(url);
      // パスネームからキーを取得
      const pathname = urlObj.pathname;
      // 先頭のスラッシュを削除
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch (e) {
      console.error('URLの解析エラー:', e);
      return null;
    }
  };

  // 画像読み込みエラー時の処理
  const handleImageError = async () => {
    // すでにロード中または既にエラー処理済みの場合は処理しない
    if (isLoading || error) return;
    
    try {
      setIsLoading(true);
      
      // URLからS3のキーを抽出
      const key = extractS3Key(src);
      if (!key) {
        throw new Error('画像キーの抽出に失敗しました');
      }
      
      console.log('署名付きURL再取得開始:', key);
      
      // 新しい署名付きURLを取得
      const newSignedUrl = await getSignedPhotoUrl(key);
      
      console.log('署名付きURL再取得完了');
      
      // 新しいURLをセット
      setImageSrc(newSignedUrl);
      setError(null);
    } catch (e) {
      console.error('署名付きURL更新エラー:', e);
      setError(e instanceof Error ? e.message : '画像の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <p className="text-destructive text-sm">画像の読み込みに失敗しました</p>
        <button 
          className="text-primary text-xs mt-2 underline"
          onClick={() => handleImageError()}
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt || 'イメージ'}
      className={className}
      onError={handleImageError}
      {...props}
    />
  );
}