import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from 'sharp';
import type { ImageMetadata } from "@shared/schema";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 画像の最適化とリサイズを行う関数
async function optimizeImage(buffer: Buffer, contentType: string): Promise<{ buffer: Buffer, metadata: ImageMetadata }> {
  try {
    console.log('Starting image optimization:', {
      originalSize: buffer.length,
      contentType,
      timestamp: new Date().toISOString()
    });

    // メモリ使用量を最適化するためにストリームを使用
    let sharpInstance = sharp(buffer, {
      failOnError: true,
      limitInputPixels: 50000000 // 50MP制限
    });

    // 画像情報の取得
    const metadata = await sharpInstance.metadata();
    console.log('Original image metadata:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      timestamp: new Date().toISOString()
    });

    // 4:3のアスペクト比で800x600にリサイズ
    sharpInstance = sharpInstance
      .resize({
        width: 800,
        height: 600,
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true // 小さい画像は拡大しない
      });

    // コンテンツタイプに応じて最適な形式で出力
    if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
      sharpInstance = sharpInstance.jpeg({ 
        quality: 80,
        chromaSubsampling: '4:2:0',
        mozjpeg: true // より高度な圧縮
      });
    } else if (contentType === 'image/png') {
      sharpInstance = sharpInstance.png({ 
        compressionLevel: 9,
        palette: true // 可能な場合はパレットモードを使用
      });
    } else if (contentType === 'image/webp') {
      sharpInstance = sharpInstance.webp({ 
        quality: 80,
        effort: 6 // 圧縮の努力レベル（0-6）
      });
    }

    const optimizedBuffer = await sharpInstance.toBuffer();

    const resultMetadata: ImageMetadata = {
      width: 800,
      height: 600,
      format: contentType.split('/')[1],
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length
    };

    console.log('Image optimization completed:', {
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: (optimizedBuffer.length / buffer.length * 100).toFixed(2) + '%',
      metadata: resultMetadata,
      timestamp: new Date().toISOString()
    });

    return {
      buffer: optimizedBuffer,
      metadata: resultMetadata
    };
  } catch (error) {
    console.error('Image optimization error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw new Error(`画像の最適化に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const uploadToS3 = async (
  base64Data: string,
  fileName: string
): Promise<{ url: string, metadata: ImageMetadata }> => {
  try {
    console.log('Starting S3 upload:', {
      fileName,
      timestamp: new Date().toISOString()
    });

    // Content-Typeの抽出と検証
    const contentTypeMatch = base64Data.match(/^data:([^;]+);base64,/);
    if (!contentTypeMatch) {
      throw new Error('無効な画像形式です');
    }
    const contentType = contentTypeMatch[1];

    // 許可された画像形式のチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      throw new Error('サポートされていない画像形式です。JPEG、PNG、WebPのみ使用可能です。');
    }

    // Base64データの処理
    const base64Content = base64Data.replace(/^data:([^;]+);base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    // 画像サイズの制限チェック（10MB）
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('画像サイズが大きすぎます（上限：10MB）');
    }

    // 画像の最適化
    const { buffer: optimizedBuffer, metadata } = await optimizeImage(buffer, contentType);

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
        'x-amz-meta-width': metadata.width.toString(),
        'x-amz-meta-height': metadata.height.toString(),
        'x-amz-meta-format': metadata.format,
        'x-amz-meta-original-size': metadata.originalSize.toString(),
        'x-amz-meta-optimized-size': metadata.optimizedSize.toString(),
        'x-amz-meta-uploaded-by': 'scai-app',
        'x-amz-meta-timestamp': new Date().toISOString()
      },
      CacheControl: 'max-age=31536000' // 1年間のキャッシュを設定
    });

    console.log('Executing S3 upload command:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key: uniqueFileName,
      contentType,
      metadata,
      timestamp: new Date().toISOString()
    });

    await s3Client.send(command);

    // プリサインドURLを生成
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName
    });

    // 1時間有効なプリサインドURLを生成
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    console.log('S3 upload successful:', {
      fileName: uniqueFileName,
      metadata,
      timestamp: new Date().toISOString()
    });

    return {
      url: signedUrl,
      metadata
    };
  } catch (error) {
    console.error('S3 upload error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileName,
      timestamp: new Date().toISOString()
    });
    throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      key,
      timestamp: new Date().toISOString()
    });
    throw new Error(`署名付きURLの生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};