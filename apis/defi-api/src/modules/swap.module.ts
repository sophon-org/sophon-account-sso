import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { SwapController } from '../controllers/swap.controller';
import { MonitoringController } from '../controllers/monitoring.controller';
import { SwapService } from '../services/swap.service';
import { ProviderRegistryService } from '../services/provider-registry.service';
import { LoggingService } from '../services/logging.service';
import { ChainValidationService } from '../services/chain-validation.service';
import { SwapsProvider } from '../providers/swaps.provider';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { RateLimitGuard } from '../guards/rate-limit.guard';

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
      useFactory: (registry: ProviderRegistryService, swapsProvider: SwapsProvider) => {
        registry.registerProvider(swapsProvider);
        return registry;
      },
      inject: [ProviderRegistryService, SwapsProvider],
    },
    {
      provide: 'CHAIN_VALIDATION_SETUP',
      useFactory: (chainValidationService: ChainValidationService) => {
        (global as any).chainValidationService = chainValidationService;
        return chainValidationService;
      },
      inject: [ChainValidationService],
    },
  ],
  exports: [SwapService, ProviderRegistryService, LoggingService, ChainValidationService],
})
export class SwapModule {}