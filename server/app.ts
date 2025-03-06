import express from 'express';
const app = express();

// ボディパーサーの制限を大幅に増やす
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

export default app;