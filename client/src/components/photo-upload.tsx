import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, X } from "lucide-react";
import { photoTags, type Photo } from "@shared/schema";

interface PhotoUploadProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

export const PhotoUpload = ({ photos = [], onChange }: PhotoUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<string | null> => {
    try {
      // ファイルサイズチェック（2MB以下）
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "エラー",
          description: "ファイルサイズは2MB以下にしてください。",
          variant: "destructive",
        });
        return null;
      }

      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 画像の圧縮処理
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // 圧縮品質を0.5に設定
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);

      // Base64データのサイズをチェック
      const base64Size = compressedDataUrl.length * 0.75;
      if (base64Size > 512 * 1024) { // 512KB以上の場合はスキップ
        toast({
          title: "エラー",
          description: "画像サイズを小さくできませんでした。別の画像を試してください。",
          variant: "destructive",
        });
        return null;
      }

      return compressedDataUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "エラー",
        description: "画像の処理中にエラーが発生しました。",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setSelectedFiles(files);
    const newPhotos: Photo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressedDataUrl = await compressImage(file);

      if (compressedDataUrl) {
        newPhotos.push({
          url: compressedDataUrl,
          tag: photoTags[0],
        });
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasHairColorPhoto = photos.some((photo) => photo.tag === "現在の髪色");

  return (
    <div className="space-y-6">
      {/* 既存の写真一覧 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
              <img
                src={photo.url}
                alt={`プロフィール写真 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <Select
                value={photo.tag}
                onValueChange={(tag) => {
                  const updatedPhotos = [...photos];
                  updatedPhotos[index] = { ...photo, tag: tag as typeof photoTags[number] };
                  onChange(updatedPhotos);
                }}
              >
                <SelectTrigger className="bg-white/90">
                  <SelectValue placeholder="タグを選択" />
                </SelectTrigger>
                <SelectContent>
                  {photoTags.map((tag) => (
                    <SelectItem
                      key={tag}
                      value={tag}
                      disabled={tag === "現在の髪色" && hasHairColorPhoto && photo.tag !== "現在の髪色"}
                    >
                      {tag}
                      {tag === "現在の髪色" && " (必須)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const updatedPhotos = photos.filter((_, i) => i !== index);
                  onChange(updatedPhotos);
                }}
              >
                削除
              </Button>
            </div>
            <Badge
              className={`absolute top-2 right-2 ${photo.tag === "現在の髪色" ? "bg-primary text-primary-foreground" : "bg-white/90 text-black"}`}
            >
              {photo.tag}
            </Badge>
          </div>
        ))}
      </div>

      {/* 新規アップロード */}
      {photos.length < 20 && (
        <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">写真をアップロード</h3>
            <p className="text-xs text-muted-foreground mt-1">
              クリックまたはドラッグ＆ドロップで複数の写真を選択できます
            </p>
          </div>

          <div className="flex justify-center">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Button type="button" variant="outline" className="relative">
                写真を選択
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </Button>
            </label>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>※最大20枚までアップロード可能です（1枚あたり2MBまで）</p>
        <p className="font-medium text-primary">※現在の髪色の写真は必須です。</p>
        <p>※傷、タトゥー、アトピーがある場合は、該当部位の写真を必ずアップロードしタグ付けしてください。</p>
      </div>
    </div>
  );
};