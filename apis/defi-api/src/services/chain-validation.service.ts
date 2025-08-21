import { Injectable } from '@nestjs/common';
import type { ChainId } from '../types/common.types';
import type { ProviderRegistryService } from './provider-registry.service';

@Injectable()
export class ChainValidationService {
  constructor(private readonly providerRegistry: ProviderRegistryService) {}

  getSupportedChains(providerId?: string): ChainId[] {
    if (providerId) {
      try {
        const provider = this.providerRegistry.getProvider(providerId);
        return provider.supportedChains;
      } catch {
        return [];
      }
    }

    const enabledProviders = this.providerRegistry.getEnabledProviders();
    const allChains = new Set<ChainId>();

    enabledProviders.forEach((provider) => {
      provider.supportedChains.forEach((chainId) => allChains.add(chainId));
    });

    return Array.from(allChains);
  }

  isChainSupported(chainId: ChainId, providerId?: string): boolean {
    const supportedChains = this.getSupportedChains(providerId);
    return supportedChains.includes(chainId);
  }

  validateChainForProvider(
    chainId: ChainId,
    providerId?: string,
  ): { isValid: boolean; error?: string } {
    if (providerId) {
      try {
        this.providerRegistry.getProvider(providerId);
      } catch (error) {
        return {
          isValid: false,
          error: `Provider '${providerId}' not found or disabled`,
        };
      }

      if (!this.isChainSupported(chainId, providerId)) {
        const supportedChains = this.getSupportedChains(providerId);
        return {
          isValid: false,
          error: `Chain ${chainId} is not supported by provider '${providerId}'. Supported chains: ${supportedChains.join(', ')}`,
        };
      }
    } else {
      if (!this.isChainSupported(chainId)) {
        const supportedChains = this.getSupportedChains();
        return {
          isValid: false,
          error: `Chain ${chainId} is not supported by any enabled provider. Supported chains: ${supportedChains.join(', ')}`,
        };
      }
    }

    return { isValid: true };
  }
}
