import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface UploadOptions {
  contentType: string;
  extension: string;
  prefix?: string;
}

export const uploadToS3 = async (
  buffer: Buffer,
  options: UploadOptions
): Promise<{ key: string }> => {
  try {
    console.log('Starting S3 upload:', {
      contentType: options.contentType,
      timestamp: new Date().toISOString()
    });

    // ファイル名に現在のタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const key = `${options.prefix || ''}${timestamp}.${options.extension}`;

    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: options.contentType,
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    await s3Client.send(command);

    console.log('S3 upload successful:', {
      key,
      timestamp: new Date().toISOString()
    });

    return { key };
  } catch (error) {
    console.error('S3 upload error:', {
      error,
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