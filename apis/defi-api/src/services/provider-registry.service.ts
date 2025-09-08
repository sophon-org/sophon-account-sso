import { Injectable, Logger } from '@nestjs/common';
import { ErrorCodes, SwapAPIError } from '../errors/swap-api.error';
import { ISwapProvider } from '../interfaces/swap-provider.interface';
import { UnifiedTransactionRequest } from '../types/unified.types';

@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private readonly providers = new Map<string, ISwapProvider>();

  registerProvider(provider: ISwapProvider): void {
    this.providers.set(provider.providerId, provider);
    this.logger.log(
      `Registered provider: ${provider.name} (${provider.providerId})`,
    );
  }

  getProvider(providerId: string): ISwapProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new SwapAPIError(
        `Provider '${providerId}' not found`,
        ErrorCodes.PROVIDER_NOT_FOUND,
        providerId,
        null,
        404,
      );
    }

    if (!provider.isEnabled()) {
      throw new SwapAPIError(
        `Provider '${providerId}' is disabled`,
        ErrorCodes.PROVIDER_DISABLED,
        providerId,
        null,
        503,
      );
    }

    return provider;
  }

  getAllProviders(): ISwapProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): ISwapProvider[] {
    return this.getAllProviders().filter((provider) => provider.isEnabled());
  }

  selectBestProvider(
    request: UnifiedTransactionRequest,
    preferredProviderId?: string,
  ): ISwapProvider {
    if (preferredProviderId) {
      return this.getProvider(preferredProviderId);
    }

    const enabledProviders = this.getEnabledProviders();

    if (enabledProviders.length === 0) {
      throw new SwapAPIError(
        'No enabled providers available',
        ErrorCodes.PROVIDER_ERROR,
        undefined,
        null,
        503,
      );
    }

    const compatibleProviders = enabledProviders.filter((provider) =>
      this.isProviderCompatible(provider, request),
    );

    if (compatibleProviders.length === 0) {
      throw new SwapAPIError(
        `No compatible providers found for route ${request.sourceChain} -> ${request.destinationChain}`,
        ErrorCodes.UNSUPPORTED_ROUTE,
      );
    }

    return this.selectProviderByPriority(compatibleProviders);
  }

  private isProviderCompatible(
    provider: ISwapProvider,
    request: UnifiedTransactionRequest,
  ): boolean {
    const { sourceChain, destinationChain } = request;

    const supportsSourceChain = provider.supportedChains.includes(sourceChain);
    const supportsDestinationChain =
      provider.supportedChains.includes(destinationChain);

    if (!supportsSourceChain || !supportsDestinationChain) {
      return false;
    }

    return true;
  }

  private selectProviderByPriority(providers: ISwapProvider[]): ISwapProvider {
    return providers[0];
  }

  getProviderSummary() {
    return this.getAllProviders().map((provider) => ({
      providerId: provider.providerId,
      name: provider.name,
      enabled: provider.isEnabled(),
      supportedChains: provider.supportedChains,
    }));
  }
}
