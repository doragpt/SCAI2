import type { Express } from "express";
import { createServer, type Server } from "http";
import storeRoutes from './routes/store';
import applicationsRoutes from './routes/applications';
import blogRoutes from './routes/blog';
import dashboardRoutes from './routes/dashboard';
import designRoutes from './routes/design';
import { log } from './utils/logger';
import multer from "multer";
import { errorHandler } from './middleware/errorHandler';

// Multerの設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('許可されていないファイル形式です'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // APIリクエストの共通ミドルウェア
  app.use("/api/*", (req, res, next) => {
    log('info', 'APIリクエスト受信', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      timestamp: new Date().toISOString()
    });
    next();
  });

  // 各ルーターを登録
  app.use('/api/store', storeRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/design', designRoutes);

  // エラーハンドリングミドルウェアを最後に登録
  app.use(errorHandler);

  return server;
}