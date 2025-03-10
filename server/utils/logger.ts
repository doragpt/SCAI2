// ログレベルの定義
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

// ログ出力関数
function formatLogMessage(level: LogLevel, message: string, data?: LogData): string {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${logData}`;
}

export const log = {
  info: (message: string, data?: LogData) => {
    console.log(formatLogMessage('info', message, data));
  },
  warn: (message: string, data?: LogData) => {
    console.warn(formatLogMessage('warn', message, data));
  },
  error: (message: string, data?: LogData) => {
    console.error(formatLogMessage('error', message, data));
  },
  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLogMessage('debug', message, data));
    }
  }
};
