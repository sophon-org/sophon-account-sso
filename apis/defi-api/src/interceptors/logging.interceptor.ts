import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept<T>(context: ExecutionContext, next: CallHandler): Observable<T> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    const requestId = uuidv4();

    const { method, url, body, query } = request;

    this.logger.log(`Incoming request: ${method} ${url}`, {
      requestId,
      body: this.sanitizeBody(body),
      query,
    });

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        this.logger.log(`Request completed: ${method} ${url} (${duration}ms)`, {
          requestId,
          duration,
          responseSize: JSON.stringify(response).length,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(`Request failed: ${method} ${url} (${duration}ms)`, {
          requestId,
          duration,
          error: error.message,
          stack: error.stack,
        });

        throw error;
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return body;

    const sanitized = { ...body };

    const sensitiveFields = ['apiKey', 'privateKey', 'password', 'secret'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
