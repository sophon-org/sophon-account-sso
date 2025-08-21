import type { ChainId, ValidationResult } from '../types/common.types';
import type {
  UnifiedStatusRequest,
  UnifiedStatusResponse,
  UnifiedTransactionRequest,
  UnifiedTransactionResponse,
} from '../types/unified.types';

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
}
