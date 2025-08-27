import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TransactionType,
  type UnifiedTransactionRequest,
  type UnifiedTransactionResponse,
} from '../../types/swap';
import { useGetSwapTransaction } from '../useGetSwapTransaction';

// Mock the API client
const mockGet = vi.fn();
vi.mock('../../utils/apiClient', () => ({
  createApiClient: vi.fn(() => ({
    get: mockGet,
  })),
}));

const createMockRequest = (): UnifiedTransactionRequest => ({
  actionType: TransactionType.SWAP,
  sender: '0x123',
  sourceChain: 1,
  destinationChain: 8453,
  sourceToken: '0xA0b86a33E6412A8d93a8b4F15cCC9Ac5',
  destinationToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amount: BigInt('1000000000000000000'),
  slippage: 0.5,
});

const mockApiResponse: UnifiedTransactionResponse = {
  transactionId: 'test-tx-id',
  provider: 'swaps',
  transaction: {
    to: '0x456',
    data: '0xabcd',
    value: '0',
    chainId: 8453,
  },
  fees: {
    gas: '21000',
    protocol: '1000',
    total: '22000',
  },
  estimatedTime: 30,
  exchangeRate: 1.05,
  requiredApprovals: [],
};

describe('useGetSwapTransaction Hook', () => {
  const mockApiConfig = { baseUrl: 'http://localhost:4001' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const mockRequest = createMockRequest();
    const { result } = renderHook(() =>
      useGetSwapTransaction(
        { config: mockRequest, enabled: false },
        mockApiConfig,
      ),
    );

    expect(result.current.data).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch data when enabled and sender exists', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse);

    const mockRequest = createMockRequest();
    const { result } = renderHook(() =>
      useGetSwapTransaction(
        { config: mockRequest, enabled: true },
        mockApiConfig,
      ),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/swap/transaction', {
      actionType: TransactionType.SWAP,
      sender: '0x123',
      sourceChain: 1,
      destinationChain: 8453,
      sourceToken: '0xA0b86a33E6412A8d93a8b4F15cCC9Ac5',
      destinationToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '1000000000000000000',
      slippage: 0.5,
    });

    expect(result.current.data).toEqual(mockApiResponse);
    expect(result.current.error).toBe(null);
  });

  it('should not fetch when disabled', () => {
    const mockRequest = createMockRequest();
    renderHook(() =>
      useGetSwapTransaction(
        { config: mockRequest, enabled: false },
        mockApiConfig,
      ),
    );

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should not fetch when sender is missing', () => {
    const mockRequest = {
      ...createMockRequest(),
      sender: '',
    };

    renderHook(() =>
      useGetSwapTransaction(
        { config: mockRequest, enabled: true },
        mockApiConfig,
      ),
    );

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    mockGet.mockRejectedValueOnce(mockError);

    const mockRequest = createMockRequest();
    const { result } = renderHook(() =>
      useGetSwapTransaction(
        { config: mockRequest, enabled: true },
        mockApiConfig,
      ),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBe(null);
  });

  it('should include recipient when provided', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse);

    const mockRequest = {
      ...createMockRequest(),
      recipient: '0x789',
    };

    renderHook(() =>
      useGetSwapTransaction(
        { config: mockRequest, enabled: true },
        mockApiConfig,
      ),
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/swap/transaction',
      expect.objectContaining({
        recipient: '0x789',
      }),
    );
  });
});
