import { validate } from 'class-validator';
import { ChainValidationService } from '../services/chain-validation.service';
import { ProviderRegistryService } from '../services/provider-registry.service';
import {
  IsEthereumAddress,
  IsSupportedChain,
  IsValidAmount,
} from './address.validator';

interface TestDtoLax {
  address: string | number;
  amount: string | number;
  chainId: number | string;
}

class TestDto {
  @IsEthereumAddress()
  address: string;

  @IsValidAmount()
  amount: string;

  @IsSupportedChain()
  chainId: number;
}

class TestDtoWithProvider {
  @IsEthereumAddress()
  address: string;

  @IsValidAmount()
  amount: string;

  @IsSupportedChain({ providerIdField: 'provider' })
  chainId: number;

  provider: string;
}

describe('AddressValidator', () => {
  let mockChainValidationService: jest.Mocked<ChainValidationService>;
  let _mockProviderRegistry: jest.Mocked<ProviderRegistryService>;

  beforeEach(() => {
    // Create mock provider registry
    _mockProviderRegistry = {
      getProvider: jest.fn(),
      getEnabledProviders: jest.fn(),
      registerProvider: jest.fn(),
      selectBestProvider: jest.fn(),
      getProviderSummary: jest.fn(),
    } as unknown as jest.Mocked<ProviderRegistryService>;

    // Create mock chain validation service
    mockChainValidationService = {
      getSupportedChains: jest.fn(),
      isChainSupported: jest.fn(),
      validateChainForProvider: jest.fn(),
    } as unknown as jest.Mocked<ChainValidationService>;

    // Set up the global service for validator
    (
      global as typeof global & {
        chainValidationService: ChainValidationService;
      }
    ).chainValidationService = mockChainValidationService;

    // Configure mock to support chain ID 1 (Ethereum mainnet)
    mockChainValidationService.isChainSupported.mockImplementation(
      (chainId: number) => {
        return [1, 10, 137, 42161, 8453].includes(chainId);
      },
    );

    mockChainValidationService.validateChainForProvider.mockImplementation(
      (chainId: number) => {
        if ([1, 10, 137, 42161, 8453].includes(chainId)) {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: `Chain ${chainId} is not supported by any enabled provider. Supported chains: 1, 10, 137, 42161, 8453`,
        };
      },
    );
  });

  afterEach(() => {
    // Clean up global
    delete (global as typeof global & { chainValidationService?: unknown })
      .chainValidationService;
  });
  describe('IsEthereumAddress', () => {
    it('should validate valid Ethereum addresses', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors).toHaveLength(0);
    });

    it('should reject invalid Ethereum addresses', async () => {
      const dto = new TestDto();
      dto.address = 'invalid-address';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('should reject addresses with wrong length', async () => {
      const dto = new TestDto();
      dto.address = '0x123456789012345678901234567890123456789';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors.length).toBeGreaterThan(0);
    });
  });

  describe('IsValidAmount', () => {
    it('should validate positive amounts', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const amountErrors = errors.filter((e) => e.property === 'amount');
      expect(amountErrors).toHaveLength(0);
    });

    it('should reject zero amounts', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '0';
      dto.chainId = 1;

      const errors = await validate(dto);
      const amountErrors = errors.filter((e) => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should reject invalid number formats', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = 'invalid-amount';
      dto.chainId = 1;

      const errors = await validate(dto);
      const amountErrors = errors.filter((e) => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });
  });

  describe('IsSupportedChain', () => {
    it('should validate supported chain IDs', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1; // Ethereum mainnet

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors).toHaveLength(0);
    });

    it('should reject unsupported chain IDs', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 999; // Unsupported chain

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors.length).toBeGreaterThan(0);
    });

    it('should reject non-number chain IDs', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      (dto as TestDtoLax).chainId = 'invalid';

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors.length).toBeGreaterThan(0);
    });

    it('should handle missing chainValidationService', async () => {
      // Remove the service temporarily
      delete (global as Record<string, unknown>).chainValidationService;

      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors.length).toBeGreaterThan(0);

      // Restore service
      (global as Record<string, unknown>).chainValidationService =
        mockChainValidationService;
    });

    it('should handle service errors gracefully', async () => {
      mockChainValidationService.isChainSupported.mockImplementation(() => {
        throw new Error('Service error');
      });

      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors.length).toBeGreaterThan(0);
    });
  });

  describe('IsValidAmount edge cases', () => {
    it('should reject negative amounts', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '-1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const amountErrors = errors.filter((e) => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should reject non-string amounts', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      (dto as TestDtoLax).amount = 123;
      dto.chainId = 1;

      const errors = await validate(dto);
      const amountErrors = errors.filter((e) => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should reject empty string amounts', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '';
      dto.chainId = 1;

      const errors = await validate(dto);
      const amountErrors = errors.filter((e) => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });
  });

  describe('IsEthereumAddress edge cases', () => {
    it('should reject non-string addresses', async () => {
      const dto = new TestDto();
      (dto as TestDtoLax).address = 123;
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('should reject addresses without 0x prefix', async () => {
      const dto = new TestDto();
      dto.address = '1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('should reject addresses with invalid characters', async () => {
      const dto = new TestDto();
      dto.address = '0x123456789012345678901234567890123456789G';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('should accept mixed case addresses', async () => {
      const dto = new TestDto();
      dto.address = '0x1234567890aBcDeF123456789012345678901234';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;

      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'address');
      expect(addressErrors).toHaveLength(0);
    });
  });

  describe('IsSupportedChain with providerIdField', () => {
    it('should validate chain with specific provider', async () => {
      mockChainValidationService.isChainSupported.mockImplementation(
        (chainId: number, providerId?: string) => {
          if (providerId === 'swaps' && chainId === 1) return true;
          return false;
        },
      );

      const dto = new TestDtoWithProvider();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;
      dto.provider = 'swaps';

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors).toHaveLength(0);
    });

    it('should reject chain not supported by specific provider', async () => {
      mockChainValidationService.isChainSupported.mockImplementation(
        (chainId: number, providerId?: string) => {
          if (providerId === 'swaps' && chainId === 1) return true;
          return false;
        },
      );

      mockChainValidationService.validateChainForProvider.mockImplementation(
        (chainId: number, providerId?: string) => {
          if (providerId === 'swaps' && chainId === 999) {
            return {
              isValid: false,
              error: `Chain ${chainId} is not supported by provider '${providerId}'. Supported chains: 1, 10, 137`,
            };
          }
          return { isValid: true };
        },
      );

      const dto = new TestDtoWithProvider();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 999;
      dto.provider = 'swaps';

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors.length).toBeGreaterThan(0);
      expect(chainErrors[0].constraints).toEqual(
        expect.objectContaining({
          isSupportedChain: expect.stringContaining(
            'Chain 999 is not supported by provider',
          ),
        }),
      );
    });

    it('should handle missing provider field gracefully', async () => {
      const dto = new TestDtoWithProvider();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;
      // provider field is intentionally not set

      mockChainValidationService.isChainSupported.mockReturnValue(true);

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors).toHaveLength(0);
    });

    it('should handle validation service throwing errors', async () => {
      mockChainValidationService.isChainSupported.mockImplementation(() => {
        throw new Error('Service error');
      });

      const dto = new TestDtoWithProvider();
      dto.address = '0x1234567890123456789012345678901234567890';
      dto.amount = '1000000000000000000';
      dto.chainId = 1;
      dto.provider = 'swaps';

      const errors = await validate(dto);
      const chainErrors = errors.filter((e) => e.property === 'chainId');
      expect(chainErrors.length).toBeGreaterThan(0);
    });
  });
});
