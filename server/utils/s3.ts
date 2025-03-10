import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 画像の最適化とリサイズを行う関数
async function optimizeImage(buffer: Buffer, contentType: string): Promise<{ buffer: Buffer, width: number, height: number }> {
  try {
    console.log('Starting image optimization:', {
      originalSize: buffer.length,
      contentType,
      timestamp: new Date().toISOString()
    });

    let sharpInstance = sharp(buffer);

    // 画像情報の取得
    const metadata = await sharpInstance.metadata();

    // 4:3のアスペクト比で800x600にリサイズ
    sharpInstance = sharpInstance
      .resize({
        width: 800,
        height: 600,
        fit: 'cover',
        position: 'center'
      });

    // コンテンツタイプに応じて最適な形式で出力
    if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
      sharpInstance = sharpInstance.jpeg({ quality: 80 });
    } else if (contentType === 'image/png') {
      sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    } else if (contentType === 'image/webp') {
      sharpInstance = sharpInstance.webp({ quality: 80 });
    }

    const optimizedBuffer = await sharpInstance.toBuffer();

    console.log('Image optimization completed:', {
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: (optimizedBuffer.length / buffer.length * 100).toFixed(2) + '%',
      width: 800,
      height: 600,
      timestamp: new Date().toISOString()
    });

    return {
      buffer: optimizedBuffer,
      width: 800,
      height: 600
    };
  } catch (error) {
    console.error('Image optimization error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

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

    // 画像の最適化
    const { buffer: optimizedBuffer, width, height } = await optimizeImage(buffer, contentType);

    // ファイル名に現在のタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: optimizedBuffer,
      ContentType: contentType,
      // 画像サイズとメタデータを追加
      Metadata: {
        'x-amz-meta-width': width.toString(),
        'x-amz-meta-height': height.toString(),
        'x-amz-meta-original-size': buffer.length.toString(),
        'x-amz-meta-optimized-size': optimizedBuffer.length.toString(),
        'x-amz-meta-uploaded-by': 'scai-app',
        'x-amz-meta-timestamp': new Date().toISOString()
      },
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    console.log('Executing S3 upload command:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key: uniqueFileName,
      contentType,
      imageSize: `${width}x${height}`,
      timestamp: new Date().toISOString()
    });

    await s3Client.send(command);

    console.log('S3 upload successful:', {
      fileName: uniqueFileName,
      imageSize: `${width}x${height}`,
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
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};