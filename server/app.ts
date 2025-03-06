```typescript
import express from 'express';
const app = express();

// ボディパーサーの制限を増やす
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```
