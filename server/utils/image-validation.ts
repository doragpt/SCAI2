import { extname } from "path";

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_IMAGES_PER_BLOG = 50;
const ALLOWED_EXTENSIONS = [".gif", ".jpg", ".jpeg", ".png"];

export function validateImageUpload(
  file: Express.Multer.File,
  currentImagesCount: number
): { isValid: boolean; error?: string } {
  // 枚数制限のチェック
  if (currentImagesCount >= MAX_IMAGES_PER_BLOG) {
    return {
      isValid: false,
      error: "画像は最大50枚までアップロードできます"
    };
  }

  // ファイルサイズのチェック
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "ファイルサイズは500KB以下にしてください"
    };
  }

  // ファイル形式のチェック
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: "アップロードできるのは gif, jpg, png ファイルのみです"
    };
  }

  return { isValid: true };
}

export function getTotalImagesCount(existingImages: string[]): number {
  return existingImages ? existingImages.length : 0;
}

export const IMAGE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_BLOG,
  ALLOWED_EXTENSIONS
};
