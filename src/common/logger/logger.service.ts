import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_LOG_CONFIG, LogLevel } from './logger.constants';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logDir: string;
  private readonly logLevel: LogLevel;
  private readonly errorLogStream: fs.WriteStream;
  private readonly infoLogStream: fs.WriteStream;
  private readonly debugLogStream: fs.WriteStream;

  constructor(private configService: ConfigService) {
    // 从配置中获取日志目录，默认为 logs
    this.logDir = this.configService.get<string>('LOG_DIR', DEFAULT_LOG_CONFIG.LOG_DIR);
    this.logLevel = this.configService.get<LogLevel>('LOG_LEVEL', DEFAULT_LOG_CONFIG.LOG_LEVEL);
    
    // 确保日志目录存在
    this.ensureLogDirectory();
    
    // 创建日志流
    this.errorLogStream = this.createLogStream(LogLevel.ERROR);
    this.infoLogStream = this.createLogStream(LogLevel.INFO);
    this.debugLogStream = this.createLogStream(LogLevel.DEBUG);
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    try {
      // 如果是绝对路径，使用它，否则使用相对路径
      const logPath = path.isAbsolute(this.logDir) 
        ? this.logDir 
        : path.join(process.cwd(), this.logDir);
      
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
      }
    } catch (error) {
      console.error(`创建日志目录失败: ${error.message}`);
    }
  }

  /**
   * 创建日志写入流
   */
  private createLogStream(level: LogLevel): fs.WriteStream {
    try {
      const date = new Date().toISOString().split('T')[0]; // 获取当前日期，格式为 YYYY-MM-DD
      const logPath = path.isAbsolute(this.logDir) 
        ? this.logDir 
        : path.join(process.cwd(), this.logDir);
      const filePath = path.join(logPath, `${level}-${date}.log`);
      
      return fs.createWriteStream(filePath, { flags: 'a' });
    } catch (error) {
      console.error(`创建日志流失败: ${error.message}`);
      // 返回一个假的流，避免空指针异常
      return {
        write: () => {},
        end: () => {},
      } as unknown as fs.WriteStream;
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const formattedContext = context ? `[${context}]` : '';
    let formattedMessage = message;

    // 如果消息是对象，转换为JSON字符串
    if (typeof message === 'object' && message !== null) {
      formattedMessage = JSON.stringify(message);
    }

    return `${timestamp} ${level.toUpperCase()} ${formattedContext}: ${formattedMessage}\n`;
  }

  /**
   * 记录日志的内部方法
   */
  private writeLog(level: LogLevel, message: any, context?: string): void {
    const formattedMessage = this.formatMessage(level, message, context);
    
    // 根据日志级别写入相应的日志文件
    switch (level) {
      case LogLevel.ERROR:
        this.errorLogStream.write(formattedMessage);
        break;
      case LogLevel.WARN:
        this.errorLogStream.write(formattedMessage);
        break;
      case LogLevel.INFO:
        if ([LogLevel.DEBUG, LogLevel.INFO].includes(this.logLevel)) {
          this.infoLogStream.write(formattedMessage);
        }
        break;
      case LogLevel.DEBUG:
        if (this.logLevel === LogLevel.DEBUG) {
          this.debugLogStream.write(formattedMessage);
        }
        break;
      default:
        this.infoLogStream.write(formattedMessage);
    }

    // 同时在控制台输出
    console.log(formattedMessage);
  }

  /**
   * 记录错误日志
   */
  error(message: any, trace?: string, context?: string): void {
    this.writeLog(LogLevel.ERROR, message, context);
    if (trace) {
      this.writeLog(LogLevel.ERROR, `Stack trace: ${trace}`, context);
    }
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  /**
   * 记录普通日志
   */
  log(message: any, context?: string): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  /**
   * 记录详细日志
   */
  verbose(message: any, context?: string): void {
    this.writeLog(LogLevel.VERBOSE, message, context);
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }
} 