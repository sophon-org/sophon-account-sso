import { ChainId, ValidationResult } from '../types/common.types';
import {
  UnifiedStatusRequest,
  UnifiedStatusResponse,
  UnifiedTransactionRequest,
  UnifiedTransactionResponse,
} from '../types/unified.types';

export interface HealthCheckResult {
  healthy: boolean;
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

export interface ISwapProvider {
  readonly providerId: string;
  readonly name: string;
  readonly supportedChains: ChainId[];

  prepareTransaction(
    request: UnifiedTransactionRequest,
  ): Promise<UnifiedTransactionResponse>;
  getTransactionStatus(
    request: UnifiedStatusRequest,
  ): Promise<UnifiedStatusResponse>;
  validateRequest(
    request: UnifiedTransactionRequest,
  ): Promise<ValidationResult>;
  isEnabled(): boolean;
  healthCheck(): Promise<HealthCheckResult>;
}
