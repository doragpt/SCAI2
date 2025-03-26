import React, { useState, useRef, useEffect } from 'react';
import { GalleryCategory, galleryCategories } from '@shared/schema';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Check, Image, Trash2, Upload, X, Star, StarOff } from 'lucide-react';
import { nanoid } from 'nanoid';
import { uploadPhoto } from '@/lib/queryClient';

interface PhotoGalleryEditorProps {
  photos: Array<{
    id: string;
    url: string;
    title?: string;
    description?: string;
    category: GalleryCategory;
    order?: number;
    featured?: boolean;
  }>;
  onChange: (photos: PhotoGalleryEditorProps['photos']) => void;
  className?: string;
}

export function PhotoGalleryEditor({ photos = [], onChange, className = "" }: PhotoGalleryEditorProps) {
  const [activeTab, setActiveTab] = useState<GalleryCategory>('店内');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // カテゴリごとに画像をグループ化
  const photosByCategory = galleryCategories.reduce((acc, category) => {
    acc[category] = photos.filter(photo => photo.category === category);
    // 順序でソート
    acc[category].sort((a, b) => {
      // まず特集写真を上に
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // 次に順序で並べる
      return (a.order || 0) - (b.order || 0);
    });
    return acc;
  }, {} as Record<GalleryCategory, typeof photos>);

  // アップロード処理中の写真を追跡するためのステート
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoGalleryEditorProps['photos']>([]);
  
  // propsからの写真配列が変更されたら、uploadedPhotosをリセット
  useEffect(() => {
    // 初期化時や外部からの更新を処理
    setUploadedPhotos([]);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      console.log("ファイルアップロード開始:", files.length, "個のファイル");
      // 現在の写真配列のコピーを作成
      let currentPhotos = [...photos];
      
      // ファイルを一つずつ順番に処理
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`ファイル ${i+1}/${files.length} 処理中: ${file.name}`);
        
        // Promise を使って FileReader の完了を待機
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              resolve(event.target.result);
            } else {
              reject(new Error('ファイルの読み込みに失敗しました'));
            }
          };
          reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
          reader.readAsDataURL(file);
        });
        
        let result;
        try {
          console.log(`ファイル ${file.name} を S3 にアップロード中...`);
          // 画像をアップロード
          result = await uploadPhoto(base64Data, file.name);
        } catch (error) {
          console.error('画像アップロードエラー:', error);
          // ユーザーにエラーを通知
          alert(`画像「${file.name}」のアップロードに失敗しました: ${error instanceof Error ? error.message : '原因不明のエラー'}`);
          continue; // 次のファイルに進む
        }
        
        // 成功時の処理（try-catchブロックの外）
        if (!result || !result.url) {
          console.error(`ファイル ${file.name} のアップロード結果が無効です:`, result);
          continue; // 次のファイルに進む
        }
          
        console.log(`ファイル ${file.name} のアップロード成功:`, result.url);
        
        // 新しい写真オブジェクトを作成して必ず一意のIDを持たせる
        const newPhoto = {
          id: `photo-${nanoid()}`, // IDに接頭辞を追加して確実に一意にする
          url: result.url,
          category: activeTab,
          order: currentPhotos.length,
          featured: false,
          title: `写真 ${currentPhotos.length + 1}` // デフォルトのタイトルを設定
        };
        
        // 写真配列に追加
        currentPhotos = [...currentPhotos, newPhoto];
        
        // その都度親コンポーネントに更新を通知
        console.log("写真配列を更新:", currentPhotos.length, "枚");
        onChange(currentPhotos);
      }
    } catch (error) {
      console.error('ファイル処理エラー:', error);
      alert('ファイル処理中にエラーが発生しました');
    } finally {
      // 処理完了後、アップロードフラグをオフに
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoDelete = (photoId: string) => {
    const newPhotos = photos.filter(photo => photo.id !== photoId);
    onChange(newPhotos);
  };

  const handlePhotoUpdate = (photoId: string, updates: Partial<PhotoGalleryEditorProps['photos'][0]>) => {
    const newPhotos = photos.map(photo => 
      photo.id === photoId ? { ...photo, ...updates } : photo
    );
    onChange(newPhotos);
  };

  const toggleFeatured = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      handlePhotoUpdate(photoId, { featured: !photo.featured });
    }
  };

  // カテゴリ内での順序を更新
  const movePhoto = (photoId: string, direction: 'up' | 'down') => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const categoryPhotos = photosByCategory[photo.category];
    const index = categoryPhotos.findIndex(p => p.id === photoId);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      // 上に移動
      const newOrder = categoryPhotos[index - 1].order || 0;
      const prevOrder = photo.order || 0;
      
      const newPhotos = photos.map(p => {
        if (p.id === photoId) {
          return { ...p, order: newOrder };
        } else if (p.id === categoryPhotos[index - 1].id) {
          return { ...p, order: prevOrder };
        }
        return p;
      });
      
      onChange(newPhotos);
    } else if (direction === 'down' && index < categoryPhotos.length - 1) {
      // 下に移動
      const newOrder = categoryPhotos[index + 1].order || 0;
      const prevOrder = photo.order || 0;
      
      const newPhotos = photos.map(p => {
        if (p.id === photoId) {
          return { ...p, order: newOrder };
        } else if (p.id === categoryPhotos[index + 1].id) {
          return { ...p, order: prevOrder };
        }
        return p;
      });
      
      onChange(newPhotos);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GalleryCategory)} className="w-full">
        <TabsList className="w-full mb-4 flex overflow-x-auto">
          {galleryCategories.map(category => {
            const count = photosByCategory[category]?.length || 0;
            return (
              <TabsTrigger key={category} value={category} className="flex-1">
                {category} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {galleryCategories.map(category => (
          <TabsContent key={category} value={category} className="w-full">
            <div className="mb-4">
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }} 
                disabled={isUploading} 
                className="w-full"
              >
                {isUploading ? '画像をアップロード中...' : '写真を追加'} <Upload className="ml-2 h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground text-right mt-1">
                推奨画像サイズ: 200 × 150 px
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {photosByCategory[category]?.map((photo, index) => (
                <Card key={photo.id} className="overflow-hidden">
                  <CardHeader className="p-2 bg-muted/20 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm flex items-center">
                      {photo.featured && <Star className="h-4 w-4 text-yellow-500 mr-1" />}
                      {photo.title || `写真 ${index + 1}`}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFeatured(photo.id);
                        }}
                        title={photo.featured ? "注目を解除" : "注目写真に設定"}
                      >
                        {photo.featured ? 
                          <StarOff className="h-4 w-4" /> : 
                          <Star className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePhotoDelete(photo.id);
                        }}
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <div className="relative">
                    <img
                      src={photo.url}
                      alt={photo.title || `${category}写真`}
                      className="w-[200px] h-[150px] object-cover"
                    />
                    <div className="absolute top-2 right-2 flex flex-col space-y-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          movePhoto(photo.id, 'up');
                        }}
                        disabled={index === 0}
                        className="h-8 w-8 bg-white/70 hover:bg-white"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          movePhoto(photo.id, 'down');
                        }}
                        disabled={index === photosByCategory[category].length - 1}
                        className="h-8 w-8 bg-white/70 hover:bg-white"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-2 space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor={`title-${photo.id}`}>タイトル</Label>
                      <Input
                        id={`title-${photo.id}`}
                        value={photo.title || ''}
                        onChange={(e) => handlePhotoUpdate(photo.id, { title: e.target.value })}
                        placeholder="タイトルを入力..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`description-${photo.id}`}>説明</Label>
                      <Textarea
                        id={`description-${photo.id}`}
                        value={photo.description || ''}
                        onChange={(e) => handlePhotoUpdate(photo.id, { description: e.target.value })}
                        placeholder="説明文を入力..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`category-${photo.id}`}>カテゴリ</Label>
                      <Select
                        value={photo.category}
                        onValueChange={(value) => handlePhotoUpdate(photo.id, { category: value as GalleryCategory })}
                      >
                        <SelectTrigger id={`category-${photo.id}`}>
                          <SelectValue placeholder="カテゴリを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {galleryCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {photosByCategory[category]?.length === 0 && (
                <div className="col-span-full text-center p-8 bg-muted/20 rounded-lg">
                  <Image className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">このカテゴリにはまだ写真がありません</p>
                  <p className="text-sm text-muted-foreground">「写真を追加」ボタンをクリックして追加してください</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ChevronUp,ChevronDownコンポーネントが未定義なので、簡易的に定義
function ChevronUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="m18 15-6-6-6 6"/>
    </svg>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}