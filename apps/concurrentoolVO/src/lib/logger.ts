import { Sentry } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = import.meta.env.PROD ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>) {
    if (shouldLog('debug')) console.debug(`[DEBUG] ${message}`, data ?? '');
  },

  info(message: string, data?: Record<string, unknown>) {
    if (shouldLog('info')) console.info(`[INFO] ${message}`, data ?? '');
  },

  warn(message: string, data?: Record<string, unknown>) {
    if (shouldLog('warn')) console.warn(`[WARN] ${message}`, data ?? '');
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    if (shouldLog('error')) console.error(`[ERROR] ${message}`, error, data ?? '');
    if (import.meta.env.PROD && error instanceof Error) {
      Sentry.captureException(error, { extra: { message, ...data } });
    }
  },
};
