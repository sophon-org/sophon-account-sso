import { Injectable, Logger } from '@nestjs/common';
import { GetStatusDto, PrepareTransactionDto } from '../dto/swap.dto';
import { ErrorCodes, SwapAPIError } from '../errors/swap-api.error';
import { ISwapProvider } from '../interfaces/swap-provider.interface';
import {
  GetProvidersResponse,
  UnifiedStatusRequest,
  UnifiedStatusResponse,
  UnifiedTransactionRequest,
  UnifiedTransactionResponse,
} from '../types/unified.types';
import { LoggingService } from './logging.service';
import { ProviderRegistryService } from './provider-registry.service';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    private readonly providerRegistry: ProviderRegistryService,
    private readonly loggingService: LoggingService,
  ) {}

  async getProviders(): Promise<GetProvidersResponse> {
    this.loggingService.logDebug('Getting available providers');
    const providers = this.providerRegistry.getProviderSummary();
    this.loggingService.logDebug('Retrieved providers', {
      providersCount: providers.length,
      providerIds: providers.map((p) => p.providerId),
    });

    return { providers };
  }

  async prepareTransaction(
    dto: PrepareTransactionDto,
  ): Promise<UnifiedTransactionResponse> {
    this.loggingService.logDebug('Preparing transaction', {
      sourceChain: dto.sourceChain,
      destinationChain: dto.destinationChain,
      amount: dto.amount,
      provider: dto.provider,
    });

    const request = this.mapDtoToUnifiedRequest(dto);
    const provider = this.providerRegistry.selectBestProvider(
      request,
      dto.provider,
    );

    this.loggingService.logDebug('Selected provider for transaction', {
      providerId: provider.providerId,
      providerName: provider.name,
    });

    const result = await provider.prepareTransaction(request);
    this.loggingService.logDebug('Transaction prepared successfully', {
      transactionId: result.transactionId,
      providerId: result.provider,
      estimatedTime: result.estimatedTime,
    });

    return result;
  }

  async getTransactionStatus(
    dto: GetStatusDto,
  ): Promise<UnifiedStatusResponse> {
    this.loggingService.logDebug('Getting transaction status', {
      txHash: dto.txHash,
      sourceChainId: dto.sourceChainId,
      provider: dto.provider,
    });

    const request: UnifiedStatusRequest = {
      transactionHash: dto.txHash,
      sourceChainId: dto.sourceChainId,
      provider: dto.provider,
    };

    let provider: ISwapProvider;
    if (dto.provider) {
      this.loggingService.logDebug('Using specified provider', {
        providerId: dto.provider,
      });
      provider = this.providerRegistry.getProvider(dto.provider);
    } else {
      this.loggingService.logDebug(
        'No provider specified, searching enabled providers',
      );
      const enabledProviders = this.providerRegistry.getEnabledProviders();
      this.loggingService.logDebug('Found enabled providers', {
        count: enabledProviders.length,
        providerIds: enabledProviders.map((p) => p.providerId),
      });

      if (enabledProviders.length === 0) {
        this.loggingService.logDebug('No enabled providers available');
        throw new SwapAPIError(
          'No enabled providers available',
          ErrorCodes.PROVIDER_ERROR,
          undefined,
          null,
          503,
        );
      }

      for (const p of enabledProviders) {
        this.loggingService.logDebug('Trying provider', {
          providerId: p.providerId,
        });
        try {
          const result = await p.getTransactionStatus(request);
          if (result.found) {
            this.loggingService.logDebug('Transaction found by provider', {
              providerId: p.providerId,
              status: result.status,
              hasLinks: !!(
                result.links?.explorer || result.links?.providerTracker
              ),
            });
            return result;
          }
          this.loggingService.logDebug('Transaction not found by provider', {
            providerId: p.providerId,
          });
        } catch (error) {
          this.logger.warn(
            `Provider ${p.providerId} failed to find transaction: ${error.message}`,
          );
          this.loggingService.logDebug('Provider error during status check', {
            providerId: p.providerId,
            error: error.message,
          });
        }
      }

      this.loggingService.logDebug('Transaction not found in any provider');
      throw new SwapAPIError(
        'Transaction not found in any provider',
        ErrorCodes.TRANSACTION_NOT_FOUND,
        undefined,
        null,
        404,
      );
    }

    this.loggingService.logDebug('Calling provider for status', {
      providerId: provider.providerId,
    });
    const result = await provider.getTransactionStatus(request);
    this.loggingService.logDebug('Status retrieved successfully', {
      found: result.found,
      status: result.status,
      hasLinks: !!(result.links?.explorer || result.links?.providerTracker),
      hasFees: !!(result.fees?.total && result.fees.total !== '0'),
    });

    return result;
  }

  private mapDtoToUnifiedRequest(
    dto: PrepareTransactionDto,
  ): UnifiedTransactionRequest {
    return {
      actionType: dto.actionType,
      sender: dto.sender,
      sourceChain: dto.sourceChain,
      destinationChain: dto.destinationChain,
      sourceToken: dto.sourceToken,
      destinationToken: dto.destinationToken,
      amount: BigInt(dto.amount),
      slippage: dto.slippage,
      recipient: dto.recipient,
      options: {
        paymaster: dto.paymaster,
        paymasterInput: dto.paymasterInput,
        deadline: dto.deadline,
        gasLimit: dto.gasLimit,
      },
    };
  }
}
