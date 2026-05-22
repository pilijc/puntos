type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, error?: any, ...args: any[]) {
    console.error(this.formatMessage('error', message), error ?? '', ...args);
  }
}

export const logger = new Logger();
