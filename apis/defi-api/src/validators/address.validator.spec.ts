import { validate } from 'class-validator';
import { ChainValidationService } from '../services/chain-validation.service';
import { ProviderRegistryService } from '../services/provider-registry.service';
import {
  IsEthereumAddress,
  IsSupportedChain,
  IsValidAmount,
} from './address.validator';

class TestDto {
  @IsEthereumAddress()
  address: string;

  @IsValidAmount()
  amount: string;

  @IsSupportedChain()
  chainId: number;
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
  });
});
