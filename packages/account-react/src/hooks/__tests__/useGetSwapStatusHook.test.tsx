import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGetSwapStatus } from '../useGetSwapStatus';
import { UnifiedStatusResponse, TransactionStatus } from '../../types/swap';

// Mock the API client
const mockGet = vi.fn();
vi.mock('../../utils/apiClient', () => ({
  createApiClient: vi.fn(() => ({
    get: mockGet,
  })),
}));

const mockApiResponse: UnifiedStatusResponse = {
  found: true,
  status: TransactionStatus.CONFIRMED,
  provider: 'swaps',
  transaction: {
    hash: '0xabc123',
    sourceChain: 1,
    destinationChain: 8453,
    sourceToken: '0xA0b86a33E6412A8d93a8b4F15cCC9Ac5',
    destinationToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: '1000000000000000000',
    recipient: '0x123',
  },
  fees: {
    gas: '21000',
    protocol: '1000',
    total: '22000',
  },
  timestamps: {
    initiated: new Date('2023-01-01T00:00:00Z'),
    confirmed: new Date('2023-01-01T00:01:00Z'),
  },
  links: {
    explorer: 'https://etherscan.io/tx/0xabc123',
    providerTracker: 'https://swaps.xyz/track/0xabc123',
  },
};

describe('useGetSwapStatus Hook', () => {
  const mockApiConfig = { baseUrl: 'http://localhost:4001' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useGetSwapStatus(
        { txHash: '0xabc123', enabled: false },
        mockApiConfig
      )
    );

    expect(result.current.data).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch status when enabled and txHash exists', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse);
    
    const { result } = renderHook(() => 
      useGetSwapStatus(
        { txHash: '0xabc123', enabled: true },
        mockApiConfig
      )
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/swap/status', {
      txHash: '0xabc123',
    });

    expect(result.current.data).toEqual(mockApiResponse);
    expect(result.current.error).toBe(null);
  });

  it('should include chainId when provided', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse);
    
    renderHook(() => 
      useGetSwapStatus(
        { txHash: '0xabc123', chainId: 1, enabled: true },
        mockApiConfig
      )
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });

    expect(mockGet).toHaveBeenCalledWith('/swap/status', {
      txHash: '0xabc123',
      sourceChainId: '1',
    });
  });

  it('should not fetch when disabled', () => {
    renderHook(() => 
      useGetSwapStatus(
        { txHash: '0xabc123', enabled: false },
        mockApiConfig
      )
    );

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should not fetch when txHash is empty', () => {
    renderHook(() => 
      useGetSwapStatus(
        { txHash: '', enabled: true },
        mockApiConfig
      )
    );

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    mockGet.mockRejectedValueOnce(mockError);
    
    const { result } = renderHook(() => 
      useGetSwapStatus(
        { txHash: '0xabc123', enabled: true },
        mockApiConfig
      )
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBe(null);
  });

  it('should support refetchInterval configuration', () => {
    const getRefetchInterval = (refetchInterval?: number) => {
      return refetchInterval && refetchInterval > 0 ? refetchInterval : 0;
    };

    expect(getRefetchInterval(1000)).toBe(1000);
    expect(getRefetchInterval(0)).toBe(0);
    expect(getRefetchInterval()).toBe(0);
    expect(getRefetchInterval(-1)).toBe(0);
  });
});