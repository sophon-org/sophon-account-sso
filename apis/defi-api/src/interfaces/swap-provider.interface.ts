import {
  ChainId,
  ValidationResult,
} from '../types/common.types';
import {
  UnifiedTransactionRequest,
  UnifiedTransactionResponse,
  UnifiedStatusRequest,
  UnifiedStatusResponse,
} from '../types/unified.types';

export interface ISwapProvider {
  readonly providerId: string;
  readonly name: string;
  readonly supportedChains: ChainId[];

  prepareTransaction(request: UnifiedTransactionRequest): Promise<UnifiedTransactionResponse>;
  getTransactionStatus(request: UnifiedStatusRequest): Promise<UnifiedStatusResponse>;
  validateRequest(request: UnifiedTransactionRequest): Promise<ValidationResult>;
  isEnabled(): boolean;
}