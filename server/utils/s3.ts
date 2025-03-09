import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3クライアントの初期化を関数化
function createS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials are not properly configured');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const s3Client = createS3Client();

interface UploadOptions {
  contentType: string;
  extension: string;
  prefix?: string;
}

interface UploadResult {
  key: string;
  url: string;
}

export const uploadToS3 = async (
  buffer: Buffer,
  options: UploadOptions
): Promise<UploadResult> => {
  try {
    console.log('Starting S3 upload:', {
      contentType: options.contentType,
      extension: options.extension,
      prefix: options.prefix,
      bufferSize: buffer.length,
      timestamp: new Date().toISOString()
    });

    // バケット名の確認
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS bucket name is not configured');
    }

    // ファイル名に現在のタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const key = `${options.prefix || ''}${timestamp}.${options.extension}`;

    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: options.contentType,
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    await s3Client.send(command);

    // 署名付きURLを生成
    const signedUrl = await getSignedS3Url(key);

    console.log('S3 upload successful:', {
      key,
      url: signedUrl,
      contentType: options.contentType,
      timestamp: new Date().toISOString()
    });

    return { key, url: signedUrl };
  } catch (error) {
    console.error('S3 upload error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      options,
      timestamp: new Date().toISOString()
    });
    throw error instanceof Error ? error : new Error('画像のアップロードに失敗しました');
  }
};

// プリサインドURL生成用の関数
export const getSignedS3Url = async (key: string): Promise<string> => {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS bucket name is not configured');
    }

    console.log('Generating signed URL:', {
      key,
      bucket: bucketName,
      timestamp: new Date().toISOString()
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log('Signed URL generated successfully:', {
      key,
      timestamp: new Date().toISOString()
    });

    return signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      key,
      timestamp: new Date().toISOString()
    });
    throw new Error('画像URLの生成に失敗しました');
  }
};