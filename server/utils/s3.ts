import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 画像アップロードの制限値
const LIMITS = {
  MAX_FILE_SIZE: 500 * 1024, // 500KB
  MAX_IMAGES_PER_STORE: 50,
  ALLOWED_TYPES: ['image/gif', 'image/jpeg', 'image/png']
} as const;

// 店舗の画像数をチェック
async function checkStoreImageCount(storeId: number): Promise<number> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: `store-${storeId}/`
  });

  const response = await s3Client.send(command);
  return response.Contents?.length || 0;
}

// ファイルのバリデーション
function validateFile(base64Data: string, contentType: string): void {
  // Content-Typeのチェック
  if (!LIMITS.ALLOWED_TYPES.includes(contentType)) {
    throw new Error('許可されていないファイル形式です。gif, jpg, pngのみアップロード可能です。');
  }

  // Base64データの処理とサイズチェック
  const base64Content = base64Data.replace(/^data:([^;]+);base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');

  if (buffer.length > LIMITS.MAX_FILE_SIZE) {
    throw new Error('ファイルサイズが大きすぎます。500KB以下のファイルを選択してください。');
  }
}

export const uploadToS3 = async (
  base64Data: string,
  fileName: string,
  storeId: number
): Promise<string> => {
  try {
    console.log('Starting S3 upload:', {
      fileName,
      storeId,
      timestamp: new Date().toISOString()
    });

    // Content-Typeの抽出
    const contentTypeMatch = base64Data.match(/^data:([^;]+);base64,/);
    if (!contentTypeMatch) {
      throw new Error('無効なファイル形式です');
    }
    const contentType = contentTypeMatch[1];

    // ファイルのバリデーション
    validateFile(base64Data, contentType);

    // 店舗の画像数チェック
    const currentImageCount = await checkStoreImageCount(storeId);
    if (currentImageCount >= LIMITS.MAX_IMAGES_PER_STORE) {
      throw new Error(`画像の登録数が上限（${LIMITS.MAX_IMAGES_PER_STORE}枚）に達しています`);
    }

    // Base64データの処理
    const base64Content = base64Data.replace(/^data:([^;]+);base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    // ファイル名に現在のタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const uniqueFileName = `store-${storeId}/${timestamp}-${fileName}`;

    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        'x-amz-meta-store-id': storeId.toString(),
        'x-amz-meta-timestamp': new Date().toISOString()
      },
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    await s3Client.send(command);

    console.log('S3 upload successful:', {
      fileName: uniqueFileName,
      storeId,
      timestamp: new Date().toISOString()
    });

    // プリサインドURLを生成
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('S3 upload error:', {
      error,
      fileName,
      storeId,
      timestamp: new Date().toISOString()
    });
    throw error instanceof Error ? error : new Error('画像のアップロードに失敗しました');
  }
};

// プリサインドURL生成用の関数
export const getSignedS3Url = async (key: string): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', {
      error,
      key,
      timestamp: new Date().toISOString()
    });
    throw new Error('画像URLの生成に失敗しました');
  }
};