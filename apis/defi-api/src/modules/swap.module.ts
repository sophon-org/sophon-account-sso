import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MonitoringController } from '../controllers/monitoring.controller';
import { SwapController } from '../controllers/swap.controller';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { SwapsProvider } from '../providers/swaps.provider';
import { ChainValidationService } from '../services/chain-validation.service';
import { LoggingService } from '../services/logging.service';
import { ProviderRegistryService } from '../services/provider-registry.service';
import { SwapService } from '../services/swap.service';

@Module({
  controllers: [SwapController, MonitoringController],
  providers: [
    SwapService,
    ProviderRegistryService,
    LoggingService,
    ChainValidationService,
    SwapsProvider,
    RateLimitGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: 'PROVIDER_SETUP',
      useFactory: (
        registry: ProviderRegistryService,
        swapsProvider: SwapsProvider,
      ) => {
        registry.registerProvider(swapsProvider);
        return registry;
      },
      inject: [ProviderRegistryService, SwapsProvider],
    },
    {
      provide: 'CHAIN_VALIDATION_SETUP',
      useFactory: (chainValidationService: ChainValidationService) => {
        (
          global as typeof global & {
            chainValidationService: ChainValidationService;
          }
        ).chainValidationService = chainValidationService;
        return chainValidationService;
      },
      inject: [ChainValidationService],
    },
  ],
  exports: [
    SwapService,
    ProviderRegistryService,
    LoggingService,
    ChainValidationService,
  ],
})
export class SwapModule {}
