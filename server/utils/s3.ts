import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// アップロード用の署名付きURL生成
export const getSignedUploadUrl = async (
  fileName: string,
  contentType: string
): Promise<{ url: string; key: string }> => {
  try {
    // ファイル名にタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const key = `${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
      // CORSに関連するメタデータを追加
      Metadata: {
        'x-amz-meta-uploaded-by': 'scai-app',
        'x-amz-meta-timestamp': new Date().toISOString()
      },
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    console.log('Generating signed upload URL:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key,
      contentType,
      timestamp: new Date().toISOString()
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { url, key };
  } catch (error) {
    console.error('Failed to generate signed upload URL:', {
      error,
      fileName,
      contentType,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Failed to generate signed upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 画像表示用の署名付きURL生成
export const getSignedDownloadUrl = async (key: string): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key
    });

    console.log('Generating signed download URL:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key,
      timestamp: new Date().toISOString()
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Failed to generate signed download URL:', {
      error,
      key,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Failed to generate signed download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const uploadToS3 = async (
  base64Data: string,
  fileName: string
): Promise<string> => {
  try {
    console.log('Starting S3 upload:', {
      fileName,
      timestamp: new Date().toISOString()
    });

    // Content-Typeの抽出
    const contentTypeMatch = base64Data.match(/^data:([^;]+);base64,/);
    if (!contentTypeMatch) {
      throw new Error('Invalid base64 data format');
    }
    const contentType = contentTypeMatch[1];

    // Base64データの処理
    const base64Content = base64Data.replace(/^data:([^;]+);base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    // ファイル名に現在のタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
      // CORSに関連するメタデータを追加
      Metadata: {
        'x-amz-meta-uploaded-by': 'scai-app',
        'x-amz-meta-timestamp': new Date().toISOString()
      },
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    console.log('Executing S3 upload command:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key: uniqueFileName,
      contentType,
      timestamp: new Date().toISOString()
    });

    await s3Client.send(command);

    console.log('S3 upload successful:', {
      fileName: uniqueFileName,
      timestamp: new Date().toISOString()
    });

    // プリサインドURLを生成
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName
    });

    // 1時間有効なプリサインドURLを生成
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    return signedUrl;
  } catch (error) {
    console.error('S3 upload error:', {
      error,
      fileName,
      timestamp: new Date().toISOString()
    });
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};