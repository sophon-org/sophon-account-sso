import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderRegistryService } from '../services/provider-registry.service';

@ApiTags('Health')
@Controller()
export class MonitoringController {
  constructor(private readonly providerRegistry: ProviderRegistryService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const enabledProviders = this.providerRegistry.getEnabledProviders();

    // Perform actual health checks on all enabled providers
    const providerHealthChecks = await Promise.allSettled(
      enabledProviders.map(async (provider) => {
        const healthResult = await provider.healthCheck();
        return {
          id: provider.providerId,
          name: provider.name,
          enabled: provider.isEnabled(),
          healthy: healthResult.healthy,
          responseTime: healthResult.responseTime,
          error: healthResult.error,
          lastChecked: healthResult.timestamp,
        };
      }),
    );

    const providerResults = providerHealthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        id: enabledProviders[index].providerId,
        name: enabledProviders[index].name,
        enabled: enabledProviders[index].isEnabled(),
        healthy: false,
        error: 'Health check failed to execute',
        lastChecked: new Date(),
      };
    });

    const healthyProviders = providerResults.filter((p) => p.healthy).length;
    const swapApiReachable = healthyProviders > 0;

    return {
      status: swapApiReachable ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      swapApi: {
        reachable: swapApiReachable,
        enabledProviders: enabledProviders.length,
        healthyProviders,
        providers: providerResults,
      },
    };
  }
}
