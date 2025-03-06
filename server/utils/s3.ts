import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  base64Data: string,
  fileName: string
): Promise<string> => {
  try {
    console.log('Starting S3 upload:', {
      fileName,
      timestamp: new Date().toISOString()
    });

    // Base64データからバッファを作成
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");

    // ファイル名に現在のタイムスタンプを追加して一意にする
    const timestamp = new Date().getTime();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // S3にアップロード（ACL設定を削除）
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: "image/jpeg",
    });

    console.log('Executing S3 upload command:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key: uniqueFileName,
      timestamp: new Date().toISOString()
    });

    await s3Client.send(command);

    console.log('S3 upload successful:', {
      fileName: uniqueFileName,
      timestamp: new Date().toISOString()
    });

    // アップロードされた画像のURLを返す
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
    return imageUrl;
  } catch (error) {
    console.error('S3 upload error:', {
      error,
      fileName,
      timestamp: new Date().toISOString()
    });
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};