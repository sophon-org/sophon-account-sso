import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ErrorCodes, SwapAPIError } from '../errors/swap-api.error';
import { ISwapProvider } from '../interfaces/swap-provider.interface';
import { LoggingService } from '../services/logging.service';
import {
  ChainId,
  TransactionStatus,
  ValidationResult,
} from '../types/common.types';
import {
  ExtendedSwapActionResponse,
  HTTPResponse,
  SwapActionRequest,
  SwapActionResponse,
  SwapStatusResponse,
} from '../types/swaps.types';
import {
  UnifiedStatusRequest,
  UnifiedStatusResponse,
  UnifiedTransactionRequest,
  UnifiedTransactionResponse,
} from '../types/unified.types';

@Injectable()
export class SwapsProvider implements ISwapProvider {
  private readonly logger = new Logger(SwapsProvider.name);
  readonly providerId = 'swaps';
  readonly name = 'Swaps.xyz';
  readonly supportedChains: ChainId[] = [1, 10, 137, 42161, 8453, 324, 50104]; // ETH, OP, MATIC, ARB, BASE, zkSync Era, Sophon

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;

  // Chain explorer mappings
  private readonly chainExplorers: Record<ChainId, string> = {
    1: 'https://etherscan.io',
    10: 'https://optimistic.etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    8453: 'https://basescan.org',
    324: 'https://era.zksync.network',
    50104: 'https://explorer.sophon.xyz',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.baseUrl =
      this.configService.get<string>('SWAPS_BASE_URL_ACTION') || '';
    this.apiKey = this.configService.get<string>('SWAPS_API_KEY') || '';
    this.enabled =
      this.configService.get<string>('SWAPS_ENABLED', 'false') === 'true';

    this.loggingService.logProviderDebug(
      this.providerId,
      'SwapsProvider initialized',
      {
        baseUrl: this.baseUrl,
        enabled: this.enabled,
        supportedChains: this.supportedChains,
      },
    );
  }

  isEnabled(): boolean {
    return this.enabled && !!this.apiKey;
  }

  async prepareTransaction(
    request: UnifiedTransactionRequest,
  ): Promise<UnifiedTransactionResponse> {
    this.loggingService.logProviderDebug(
      this.providerId,
      'Starting prepareTransaction',
      {
        sourceChain: request.sourceChain,
        destinationChain: request.destinationChain,
        sourceToken: request.sourceToken,
        destinationToken: request.destinationToken,
        amount: request.amount.toString(),
        slippage: request.slippage,
      },
    );

    try {
      const validation = await this.validateRequest(request);
      this.loggingService.logProviderDebug(
        this.providerId,
        'Request validation completed',
        {
          isValid: validation.isValid,
          errors: validation.errors,
        },
      );

      if (!validation.isValid) {
        throw new SwapAPIError(
          `Validation failed: ${validation.errors.join(', ')}`,
          ErrorCodes.VALIDATION_ERROR,
          this.providerId,
        );
      }

      const swapRequest = this.transformToSwapRequest(request);
      this.loggingService.logProviderDebug(
        this.providerId,
        'Transformed to swap request',
        {
          actionType: swapRequest.actionType,
          slippage: swapRequest.slippage,
        },
      );

      this.loggingService.logProviderDebug(
        this.providerId,
        'Calling getAction API',
        {
          endpoint: '/getAction',
          requestData: JSON.stringify(
            swapRequest,
            (_key, value) => {
              if (typeof value === 'bigint') {
                return value.toString();
              }
              return value;
            },
            2,
          ),
        },
      );

      const swapResponse = (await this.callSwapAPI(
        '/getAction',
        swapRequest,
      )) as ExtendedSwapActionResponse;
      this.loggingService.logProviderDebug(
        this.providerId,
        'getAction API response received',
        {
          fullResponse: JSON.stringify(
            swapResponse,
            (_key, value) => {
              if (typeof value === 'bigint') {
                return value.toString();
              }
              return value;
            },
            2,
          ),
          success: swapResponse.success,
          hasError: !!swapResponse.error,
          hasTransaction: !!swapResponse.tx,
          txId: swapResponse.txId,
          protocolFee: swapResponse.protocolFee,
          applicationFee: swapResponse.applicationFee,
          bridgeFee: swapResponse.bridgeFee,
        },
      );

      // Handle API error responses
      if (!swapResponse.success && swapResponse.error) {
        this.loggingService.logProviderDebug(
          this.providerId,
          'API returned error response',
          {
            error: swapResponse.error,
          },
        );
        throw new SwapAPIError(
          `Swaps.xyz API Error: ${swapResponse.error.message}`,
          ErrorCodes.PROVIDER_ERROR,
          this.providerId,
          swapResponse.error,
        );
      }

      const unifiedResponse = this.transformToUnifiedResponse(
        swapResponse as SwapActionResponse,
        request,
      );
      this.loggingService.logProviderDebug(
        this.providerId,
        'Successfully prepared transaction',
        {
          transactionId: unifiedResponse.transactionId,
          estimatedTime: unifiedResponse.estimatedTime,
          hasTransaction: !!unifiedResponse.transaction,
        },
      );

      return unifiedResponse;
    } catch (error) {
      this.logger.error(
        `Failed to prepare transaction: ${error.message}`,
        error.stack,
      );

      if (error instanceof SwapAPIError) {
        throw error;
      }

      throw new SwapAPIError(
        'Failed to prepare transaction with Swaps.xyz',
        ErrorCodes.PROVIDER_ERROR,
        this.providerId,
        error,
      );
    }
  }

  async getTransactionStatus(
    request: UnifiedStatusRequest,
  ): Promise<UnifiedStatusResponse> {
    this.loggingService.logProviderDebug(
      this.providerId,
      'Starting getTransactionStatus',
      {
        transactionHash: request.transactionHash,
        sourceChainId: request.sourceChainId,
        provider: request.provider,
      },
    );

    try {
      // Call swap API
      const params = {
        txHash: request.transactionHash,
        ...(request.sourceChainId && { chainId: request.sourceChainId }),
      };

      this.loggingService.logProviderDebug(
        this.providerId,
        'Calling status API',
        {
          params,
          endpoint: '/getStatus',
        },
      );

      const response = (await this.callSwapAPI(
        '/getStatus',
        params,
      )) as SwapStatusResponse;
      this.loggingService.logProviderDebug(
        this.providerId,
        'Status API response received',
        {
          fullResponse: JSON.stringify(response, null, 2),
          hasTransaction: !!response.tx,
          status: response.tx?.status,
          txId: response.tx?.txId,
          hasSrcTx: !!response.tx?.srcTx,
          hasDstTx: !!response.tx?.dstTx,
          hasOrgFees: !!response.tx?.org?.appFees?.length,
          srcTxBlockExplorer: response.tx?.srcTx?.blockExplorer,
        },
      );

      // Log raw API response structure to see what's actually coming from swaps.xyz
      this.loggingService.logProviderDebug(
        this.providerId,
        'RAW API RESPONSE ANALYSIS',
        {
          responseKeys: Object.keys(response || {}),
          txKeys: response.tx ? Object.keys(response.tx) : [],
          srcTxKeys: response.tx?.srcTx ? Object.keys(response.tx.srcTx) : [],
          dstTxKeys: response.tx?.dstTx ? Object.keys(response.tx.dstTx) : [],
          orgKeys: response.tx?.org ? Object.keys(response.tx.org) : [],
          rawTxId: response.tx?.txId,
          rawSrcGasUsed: response.tx?.srcTx?.gasUsed,
          rawDstGasUsed: response.tx?.dstTx?.gasUsed,
          rawSrcBlockExplorer: response.tx?.srcTx?.blockExplorer,
          rawDstBlockExplorer: response.tx?.dstTx?.blockExplorer,
          rawAppFees: response.tx?.org?.appFees,
        },
      );

      const unifiedResponse = this.transformToUnifiedStatusResponse(response);
      this.loggingService.logProviderDebug(
        this.providerId,
        'Successfully retrieved transaction status',
        {
          found: unifiedResponse.found,
          status: unifiedResponse.status,
          hasLinks: !!(
            unifiedResponse.links?.explorer ||
            unifiedResponse.links?.providerTracker
          ),
          hasFees: !!(
            unifiedResponse.fees?.total && unifiedResponse.fees.total !== '0'
          ),
        },
      );

      return unifiedResponse;
    } catch (error) {
      this.logger.error(
        `Failed to get transaction status: ${error.message}`,
        error.stack,
      );

      if (error instanceof SwapAPIError) {
        throw error;
      }

      throw new SwapAPIError(
        'Failed to get transaction status from Swaps.xyz',
        ErrorCodes.PROVIDER_ERROR,
        this.providerId,
        error,
      );
    }
  }

  async validateRequest(
    request: UnifiedTransactionRequest,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!this.supportedChains.includes(request.sourceChain)) {
      errors.push(`Source chain ${request.sourceChain} not supported`);
    }

    if (!this.supportedChains.includes(request.destinationChain)) {
      errors.push(
        `Destination chain ${request.destinationChain} not supported`,
      );
    }

    if (request.slippage < 0.1 || request.slippage > 50) {
      errors.push('Slippage must be between 0.1% and 50%');
    }

    if (request.amount <= 0n) {
      errors.push('Amount must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public transformToSwapRequest(
    request: UnifiedTransactionRequest,
  ): SwapActionRequest {
    // Extract paymaster fields from options
    const paymaster = request.options?.paymaster;
    const paymasterInput = request.options?.paymasterInput;

    // For swaps and bridges, use swap-action
    // If user provides custom actionConfig, use evm-calldata-tx
    if (request.actionConfig?.data) {
      // User provided custom calldata, use evm-calldata-tx
      return {
        actionType: 'evm-calldata-tx',
        sender: request.sender,
        srcToken: request.sourceToken,
        srcChainId: request.sourceChain,
        dstToken: request.destinationToken,
        dstChainId: request.destinationChain,
        slippage: request.slippage * 100, // Convert to bps
        actionConfig: {
          contractAddress: request.actionConfig.contractAddress as string,
          chainId:
            (request.actionConfig.chainId as number) ||
            request.destinationChain,
          cost: {
            amount: request.amount,
            address:
              request.sourceToken ===
                '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ||
              request.sourceToken ===
                '0x0000000000000000000000000000000000000000'
                ? '0x0000000000000000000000000000000000000000'
                : request.sourceToken,
          },
          data: request.actionConfig.data as string,
          value:
            request.sourceToken ===
              '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ||
            request.sourceToken === '0x0000000000000000000000000000000000000000'
              ? request.amount
              : 0n,
        },
        ...(paymaster && { paymaster }),
        ...(paymasterInput && { paymasterInput }),
      };
    }

    // Default to swap-action for regular swaps
    return {
      actionType: 'swap-action',
      sender: request.sender,
      srcToken: request.sourceToken,
      srcChainId: request.sourceChain,
      dstToken: request.destinationToken,
      dstChainId: request.destinationChain,
      slippage: request.slippage * 100, // Convert to bps
      actionConfig: {
        swapDirection: 'exact-amount-in',
        amount: request.amount,
        receiverAddress: request.recipient || request.sender,
      },
      ...(paymaster && { paymaster }),
      ...(paymasterInput && { paymasterInput }),
    };
  }

  public transformToUnifiedResponse(
    swapResponse: SwapActionResponse,
    request: UnifiedTransactionRequest,
  ): UnifiedTransactionResponse {
    // Handle response format
    const tx = swapResponse.tx;
    const protocolFee = swapResponse.protocolFee;
    const applicationFee = swapResponse.applicationFee;
    const bridgeFee = swapResponse.bridgeFee;

    if (!tx || !tx.to) {
      this.logger.error(
        'Invalid Swaps.xyz API response structure',
        JSON.stringify(swapResponse, null, 2),
      );
      throw new Error(
        'Invalid response from Swaps.xyz API: missing transaction data',
      );
    }

    return {
      transactionId: swapResponse.txId || `${this.providerId}-${Date.now()}`,
      provider: this.providerId,
      transaction: {
        to: tx.to,
        data: tx.data || '0x',
        value: tx.value || '0',
        chainId: tx.chainId || request.sourceChain,
      },
      fees: {
        gas: tx.gasLimit || '0',
        protocol: this.parseAmountValue(protocolFee?.amount || '0'),
        total: (
          BigInt(this.parseAmountValue(protocolFee?.amount || '0')) +
          BigInt(this.parseAmountValue(applicationFee?.amount || '0')) +
          BigInt(this.parseAmountValue(bridgeFee?.amount || '0'))
        ).toString(),
      },
      estimatedTime: swapResponse.estimatedTxTime || 30,
      exchangeRate: swapResponse.exchangeRate,
      requiredApprovals: [],
    };
  }

  public transformToUnifiedStatusResponse(
    swapResponse: SwapStatusResponse,
  ): UnifiedStatusResponse {
    this.loggingService.logProviderDebug(
      this.providerId,
      'Transforming status response',
      {
        hasResponse: !!swapResponse,
        hasTx: !!swapResponse?.tx,
        status: swapResponse?.tx?.status,
        srcTxHash: swapResponse?.tx?.srcTxHash,
      },
    );

    // Log all possible field variations to understand API structure
    if (swapResponse?.tx) {
      const tx = swapResponse.tx;
      this.loggingService.logProviderDebug(
        this.providerId,
        'API FIELD MAPPING CHECK',
        {
          // Check common field name variations for txId
          txId_variations: {
            txId: tx.txId,
            id: (tx as Record<string, unknown>).id,
            transactionId: (tx as Record<string, unknown>).transactionId,
            transaction_id: (tx as Record<string, unknown>).transaction_id,
          },
          // Check gas field variations
          gas_variations: {
            srcTx_gasUsed: tx.srcTx?.gasUsed,
            srcTx_gas_used: (tx.srcTx as unknown as Record<string, unknown>)
              ?.gas_used,
            srcTx_gasConsumed: (tx.srcTx as unknown as Record<string, unknown>)
              ?.gasConsumed,
            srcTx_gas: (tx.srcTx as unknown as Record<string, unknown>)?.gas,
            dstTx_gasUsed: tx.dstTx?.gasUsed,
            dstTx_gas_used: (tx.dstTx as unknown as Record<string, unknown>)
              ?.gas_used,
            dstTx_gasConsumed: (tx.dstTx as unknown as Record<string, unknown>)
              ?.gasConsumed,
            dstTx_gas: (tx.dstTx as unknown as Record<string, unknown>)?.gas,
          },
          // Check explorer field variations
          explorer_variations: {
            srcTx_blockExplorer: tx.srcTx?.blockExplorer,
            srcTx_block_explorer: (
              tx.srcTx as unknown as Record<string, unknown>
            )?.block_explorer,
            srcTx_explorerUrl: (tx.srcTx as unknown as Record<string, unknown>)
              ?.explorerUrl,
            srcTx_explorer_url: (tx.srcTx as unknown as Record<string, unknown>)
              ?.explorer_url,
            srcTx_scanUrl: (tx.srcTx as unknown as Record<string, unknown>)
              ?.scanUrl,
          },
        },
      );
    }

    // Check if response indicates not found
    if (
      !swapResponse ||
      !swapResponse.tx ||
      (!swapResponse.tx.status && !swapResponse.tx.srcTxHash)
    ) {
      this.logger.warn('Transaction not found in Swaps.xyz response');
      this.loggingService.logProviderDebug(
        this.providerId,
        'Transaction not found, returning not found response',
      );
      return {
        found: false,
        status: TransactionStatus.PENDING,
        provider: this.providerId,
        transaction: null,
        fees: null,
        timestamps: null,
        links: null,
      };
    }

    const tx = swapResponse.tx;
    const status = this.mapSwapStatus(tx.status);

    this.loggingService.logProviderDebug(
      this.providerId,
      'Processing transaction data',
      {
        txId: tx.txId,
        status: tx.status,
        mappedStatus: status,
        srcChainId: tx.srcChainId,
        dstChainId: tx.dstChainId,
        hasSrcTx: !!tx.srcTx,
        hasDstTx: !!tx.dstTx,
        hasOrgFees: !!tx.org?.appFees?.length,
        srcTxDetails: tx.srcTx
          ? {
              gasUsed: tx.srcTx.gasUsed,
              blockExplorer: tx.srcTx.blockExplorer,
              timestamp: tx.srcTx.timestamp,
              paymentToken: tx.srcTx.paymentToken,
            }
          : null,
        dstTxDetails: tx.dstTx
          ? {
              gasUsed: tx.dstTx.gasUsed,
              timestamp: tx.dstTx.timestamp,
              paymentToken: tx.dstTx.paymentToken,
            }
          : null,
        orgDetails: tx.org
          ? {
              appId: tx.org.appId,
              affiliateId: tx.org.affiliateId,
              appFeesCount: tx.org.appFees?.length || 0,
              appFees: tx.org.appFees,
            }
          : null,
      },
    );

    const result = {
      found: true,
      status,
      provider: this.providerId,
      transaction: {
        hash: tx.srcTxHash,
        sourceChain: tx.srcChainId,
        destinationChain: tx.dstChainId,
        sourceToken:
          tx.srcTx?.paymentToken?.address ||
          '0x0000000000000000000000000000000000000000',
        destinationToken:
          tx.dstTx?.paymentToken?.address ||
          '0x0000000000000000000000000000000000000000',
        amount: this.parseAmountValue(tx.srcTx?.paymentToken?.amount || '0'),
        recipient: tx.sender,
      },
      fees: {
        gas: '0', // Swaps.xyz status API doesn't provide gas info
        protocol: '0', // No protocol fees in status response
        total: '0', // No fee info available in status endpoint
      },
      timestamps: {
        initiated: tx.srcTx?.timestamp
          ? new Date(Number.parseInt(tx.srcTx.timestamp) * 1000)
          : undefined,
        confirmed: tx.dstTx?.timestamp
          ? new Date(Number.parseInt(tx.dstTx.timestamp) * 1000)
          : undefined,
        completed: tx.dstTx?.timestamp
          ? new Date(Number.parseInt(tx.dstTx.timestamp) * 1000)
          : undefined,
      },
      links: {
        explorer: this.generateExplorerLink(
          tx.srcChainId,
          tx.srcTxHash,
          tx.srcTx?.blockExplorer,
        ),
        providerTracker: this.generateProviderTrackerLink(tx.srcTxHash), // Use srcTxHash as txId
      },
    };

    this.loggingService.logProviderDebug(
      this.providerId,
      'Final transformation result',
      {
        resultSummary: {
          found: result.found,
          status: result.status,
          hasTransaction: !!result.transaction,
          fees: {
            gas: result.fees.gas,
            protocol: result.fees.protocol,
            total: result.fees.total,
            hasNonZeroFees: result.fees.total !== '0',
          },
          links: {
            explorer: result.links.explorer,
            providerTracker: result.links.providerTracker,
            hasWorkingLinks: !!(
              result.links.explorer || result.links.providerTracker
            ),
          },
          timestamps: result.timestamps,
        },
      },
    );

    return result;
  }

  private mapSwapStatus(statusMessage: string): TransactionStatus {
    const statusMap: Record<string, TransactionStatus> = {
      success: TransactionStatus.CONFIRMED,
      failed: TransactionStatus.FAILED,
      pending: TransactionStatus.PENDING,
      processing: TransactionStatus.PENDING,
      refunded: TransactionStatus.FAILED,
    };
    return statusMap[statusMessage?.toLowerCase()] || TransactionStatus.PENDING;
  }

  public parseAmountValue(amount: string | number | bigint): string {
    if (typeof amount === 'string') {
      // Remove BigInt literal suffix
      return amount.endsWith('n') ? amount.slice(0, -1) : amount;
    }
    if (typeof amount === 'bigint') {
      return amount.toString();
    }
    if (typeof amount === 'number') {
      return amount.toString();
    }
    return '0';
  }

  private generateExplorerLink(
    chainId: ChainId,
    txHash: string,
    fallbackUrl?: string,
  ): string {
    this.loggingService.logProviderDebug(
      this.providerId,
      'Generating explorer link',
      {
        chainId,
        txHash,
        fallbackUrl,
        hasChainMapping: !!this.chainExplorers[chainId],
      },
    );

    // If API provided a working blockExplorer URL, use it
    if (fallbackUrl?.trim() && fallbackUrl !== '') {
      this.loggingService.logProviderDebug(
        this.providerId,
        'Using API provided explorer URL',
        { url: fallbackUrl },
      );
      return fallbackUrl;
    }

    // Generate from chain mapping if txHash is available
    if (txHash && this.chainExplorers[chainId]) {
      const generatedUrl = `${this.chainExplorers[chainId]}/tx/${txHash}`;
      this.loggingService.logProviderDebug(
        this.providerId,
        'Generated explorer URL from chain mapping',
        {
          url: generatedUrl,
          baseExplorer: this.chainExplorers[chainId],
        },
      );
      return generatedUrl;
    }

    this.loggingService.logProviderDebug(
      this.providerId,
      'No explorer link could be generated',
    );
    return '';
  }

  private generateProviderTrackerLink(txHash?: string): string {
    this.loggingService.logProviderDebug(
      this.providerId,
      'Generating provider tracker link',
      { txHash },
    );

    // Generate swaps.xyz tracking link using transaction hash
    if (txHash) {
      const trackerUrl = `https://swaps.xyz/tx/${txHash}`;
      this.loggingService.logProviderDebug(
        this.providerId,
        'Generated provider tracker URL',
        { url: trackerUrl },
      );
      return trackerUrl;
    }

    this.loggingService.logProviderDebug(
      this.providerId,
      'No tracker link generated - missing txHash',
    );
    return '';
  }

  private async callSwapAPI(
    endpoint: '/getAction',
    data: SwapActionRequest,
  ): Promise<ExtendedSwapActionResponse>;
  private async callSwapAPI(
    endpoint: '/getStatus',
    data: { chainId: number; txHash: string },
  ): Promise<SwapStatusResponse>;
  private async callSwapAPI(
    endpoint: string,
    data?: SwapActionRequest | { chainId: number; txHash: string },
  ): Promise<ExtendedSwapActionResponse | SwapStatusResponse> {
    this.loggingService.logProviderDebug(this.providerId, 'Making API call', {
      endpoint,
      hasData: !!data,
      hasApiKey: !!this.apiKey,
    });

    if (!this.apiKey) {
      this.loggingService.logProviderDebug(
        this.providerId,
        'API key not configured',
      );
      throw new SwapAPIError(
        'Swaps.xyz API key not configured',
        ErrorCodes.API_KEY_ERROR,
        this.providerId,
      );
    }

    try {
      let response: HTTPResponse;

      if (endpoint === '/getAction' && data) {
        this.loggingService.logProviderDebug(
          this.providerId,
          'Using getAction endpoint',
        );
        // getAction endpoint
        const actionBaseUrl =
          this.configService.get<string>('SWAPS_BASE_URL_ACTION') || '';
        const params = new URLSearchParams();

        // Use bigint serializer
        const bigintSerializer = (_key: string, value: unknown) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        };

        const serializedData = JSON.stringify(data, bigintSerializer);
        params.append('arguments', serializedData);

        const fullUrl = `${actionBaseUrl}${endpoint}?${params.toString()}`;

        this.loggingService.logProviderDebug(
          this.providerId,
          'Making getAction HTTP request',
          {
            url: fullUrl.replace(this.apiKey, '[REDACTED]'),
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': '[REDACTED]',
            },
            requestParams: serializedData,
          },
        );

        const actionClient = axios.create({
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          timeout: 30000,
        });

        response = await actionClient.get(fullUrl);
        this.loggingService.logProviderDebug(
          this.providerId,
          'getAction HTTP response received',
          {
            statusCode: response.status,
            statusText: response.statusText,
            headers: response.headers,
            dataSize: JSON.stringify(response.data).length,
            responseData: JSON.stringify(response.data, null, 2),
          },
        );
      } else if (endpoint === '/getStatus' && data) {
        this.loggingService.logProviderDebug(
          this.providerId,
          'Using getStatus endpoint',
        );
        // Status endpoint
        const statusBaseUrl =
          this.configService.get<string>('SWAPS_BASE_URL_STATUS') || '';
        const params = new URLSearchParams();
        Object.keys(data).forEach((key) => {
          params.append(key, data[key].toString());
        });

        const fullUrl = `${statusBaseUrl}${endpoint}?${params.toString()}`;

        this.loggingService.logProviderDebug(
          this.providerId,
          'Making getStatus HTTP request',
          {
            url: fullUrl.replace(this.apiKey, '[REDACTED]'),
            method: 'GET',
            headers: {
              'x-api-key': '[REDACTED]',
            },
            queryParams: Object.fromEntries(params.entries()),
          },
        );

        const statusClient = axios.create({
          headers: {
            'x-api-key': this.apiKey,
          },
          timeout: 30000,
        });

        response = await statusClient.get(fullUrl);
        this.loggingService.logProviderDebug(
          this.providerId,
          'getStatus HTTP response received',
          {
            statusCode: response.status,
            statusText: response.statusText,
            headers: response.headers,
            dataSize: JSON.stringify(response.data).length,
            responseData: JSON.stringify(response.data, null, 2),
          },
        );
      } else if (data) {
        // Other endpoints use POST
        const client = axios.create({
          baseURL: this.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          timeout: 30000,
        });
        response = await client.post(endpoint, data);
      } else {
        // Simple GET request
        const client = axios.create({
          baseURL: this.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          timeout: 30000,
        });
        response = await client.get(endpoint);
      }

      this.loggingService.logProviderDebug(
        this.providerId,
        'API call successful',
        {
          endpoint,
          hasResponseData: !!response.data,
        },
      );

      return response.data as ExtendedSwapActionResponse | SwapStatusResponse;
    } catch (error) {
      this.logger.error(`Swaps.xyz API call failed: ${error.message}`);
      this.loggingService.logProviderDebug(
        this.providerId,
        'HTTP request failed',
        {
          endpoint,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseHeaders: error.response?.headers,
          responseData: error.response?.data
            ? JSON.stringify(error.response.data, null, 2)
            : 'No response data',
          requestConfig: {
            url: error.config?.url?.replace(this.apiKey, '[REDACTED]'),
            method: error.config?.method,
            timeout: error.config?.timeout,
          },
        },
      );

      // Log error details
      if (error.response) {
        this.logger.error(
          `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`,
        );
      }

      throw new SwapAPIError(
        `Swaps.xyz API call failed: ${error.message}`,
        ErrorCodes.NETWORK_ERROR,
        this.providerId,
        error,
      );
    }
  }
}
