import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requests = new Map<string, RateLimitEntry>();
  private readonly windowMs = 60 * 1000; // 1 minute window
  private readonly maxRequests = 100; // requests per window

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientId = this.getClientId(request);
    
    const now = Date.now();
    const entry = this.requests.get(clientId);

    if (!entry || now > entry.resetTime) {
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for client: ${clientId}`, {
        clientId,
        count: entry.count,
        maxRequests: this.maxRequests,
        resetTime: new Date(entry.resetTime),
      });

      throw new HttpException(
        {
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
    return true;
  }

  private getClientId(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    return `${ip}-${userAgent}`;
  }

  getStats(): { totalClients: number; activeClients: number } {
    const now = Date.now();
    let activeClients = 0;
    
    for (const [clientId, entry] of this.requests.entries()) {
      if (now <= entry.resetTime) {
        activeClients++;
      } else {
        this.requests.delete(clientId);
      }
    }

    return {
      totalClients: this.requests.size,
      activeClients,
    };
  }
}