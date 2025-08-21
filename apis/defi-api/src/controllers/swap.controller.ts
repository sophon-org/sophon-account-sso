import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { GetStatusDto, PrepareTransactionDto } from '../dto/swap.dto';
import { SwapAPIError } from '../errors/swap-api.error';
import type { LoggingService } from '../services/logging.service';
import type { SwapService } from '../services/swap.service';
import type {
  GetProvidersResponse,
  UnifiedStatusResponse,
  UnifiedTransactionResponse,
} from '../types/unified.types';

@ApiTags('Swap')
@Controller('swap')
@UsePipes(new ValidationPipe({ transform: true }))
export class SwapController {
  private readonly logger = new Logger(SwapController.name);

  constructor(
    private readonly swapService: SwapService,
    private readonly loggingService: LoggingService,
  ) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get available swap providers' })
  @ApiResponse({ status: 200, description: 'List of available providers' })
  async getProviders(): Promise<GetProvidersResponse> {
    this.loggingService.logDebug('GET /swap/providers endpoint called');
    try {
      const result = await this.swapService.getProviders();
      this.loggingService.logDebug(
        'GET /swap/providers completed successfully',
        {
          providersCount: result.providers.length,
        },
      );
      return result;
    } catch (error) {
      this.loggingService.logDebug('GET /swap/providers failed', {
        error: error.message,
      });
      this.handleError(error);
    }
  }

  @Get('transaction')
  @ApiOperation({ summary: 'Prepare a cross-chain transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction prepared successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async prepareTransaction(
    @Query() dto: PrepareTransactionDto,
  ): Promise<UnifiedTransactionResponse> {
    this.loggingService.logDebug('GET /swap/transaction endpoint called', {
      sourceChain: dto.sourceChain,
      destinationChain: dto.destinationChain,
      provider: dto.provider,
    });
    try {
      const result = await this.swapService.prepareTransaction(dto);
      this.loggingService.logDebug(
        'GET /swap/transaction completed successfully',
        {
          transactionId: result.transactionId,
          provider: result.provider,
        },
      );
      return result;
    } catch (error) {
      this.loggingService.logDebug('GET /swap/transaction failed', {
        error: error.message,
        sourceChain: dto.sourceChain,
        destinationChain: dto.destinationChain,
      });
      this.handleError(error);
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionStatus(
    @Query() dto: GetStatusDto,
  ): Promise<UnifiedStatusResponse> {
    this.loggingService.logDebug('GET /swap/status endpoint called', {
      txHash: dto.txHash,
      sourceChainId: dto.sourceChainId,
      provider: dto.provider,
    });
    try {
      const result = await this.swapService.getTransactionStatus(dto);
      this.loggingService.logDebug('GET /swap/status completed successfully', {
        found: result.found,
        status: result.status,
        hasLinks: !!(result.links?.explorer || result.links?.providerTracker),
        hasFees: !!(result.fees?.total && result.fees.total !== '0'),
      });
      return result;
    } catch (error) {
      this.loggingService.logDebug('GET /swap/status failed', {
        error: error.message,
        txHash: dto.txHash,
      });
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    this.logger.error(`Controller error: ${error.message}`, error.stack);

    if (error instanceof SwapAPIError) {
      throw new HttpException(error.toJSON(), error.statusCode);
    }

    throw new HttpException(
      {
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
