// ログレベルの定義
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ログデータの型定義
interface LogData {
  [key: string]: any;
}

// ログメッセージのフォーマット関数
function formatLogMessage(level: LogLevel, message: string, data?: LogData): string {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${logData}`;
}

// ログ関数を直接exportする形式に変更
export function log(level: LogLevel, message: string, data?: LogData): void {
  const formattedMessage = formatLogMessage(level, message, data);
  switch (level) {
    case 'info':
      console.log(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formattedMessage);
      }
      break;
  }
}