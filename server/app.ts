import express from 'express';
const app = express();

// ボディパーサーの制限を調整
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// アップロード用の制限を別途設定
app.use('/api/upload-photo-chunk', express.json({ limit: '1mb' }));
app.use('/api/upload-photo', express.json({ limit: '1mb' }));

export default app;