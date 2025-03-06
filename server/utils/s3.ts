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
  // Base64データからバッファを作成
  const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");

  // ファイル名に現在のタイムスタンプを追加して一意にする
  const timestamp = new Date().getTime();
  const uniqueFileName = `${timestamp}-${fileName}`;

  // S3にアップロード
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: uniqueFileName,
    Body: buffer,
    ContentType: "image/jpeg",
    ACL: "public-read", // URLで直接アクセス可能にする
  });

  await s3Client.send(command);

  // アップロードされた画像のURLを返す
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
};
