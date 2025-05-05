/**
 * 日志级别枚举
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * 默认日志配置
 */
export const DEFAULT_LOG_CONFIG = {
  LOG_DIR: 'logs',
  LOG_LEVEL: LogLevel.INFO,
}; 