import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  logProviderError(
    providerId: string,
    error: string,
    metadata?: Record<string, any>,
  ): void {
    this.logger.error(`Provider ${providerId} error: ${error}`, metadata);
  }

  logProviderInfo(
    providerId: string,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    this.logger.log(`Provider ${providerId}: ${message}`, metadata);
  }

  logProviderDebug(
    providerId: string,
    message: string,
    metadata?: Record<string, any>,
  ): void {
    this.logger.debug(`Provider ${providerId}: ${message}`, metadata);
  }

  logDebug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, metadata);
  }
}
