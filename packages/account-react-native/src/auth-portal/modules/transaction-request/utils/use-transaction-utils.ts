import {
  BlockExplorerURL,
  ExplorerAPIURL,
  type ExplorerContractInfo,
} from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { type Address, formatEther, isAddress } from 'viem';
import {
  enrichApprovalTransaction,
  enrichContractTransaction,
  enrichERC20Transaction,
} from '../../../../enrichers';
import { decodeTransactionData } from '../../../../enrichers/enrichment-utils';
import { getProxyImplementation } from '../../../../enrichers/proxy-utils';
import { enrichSOPHTransaction } from '../../../../enrichers/soph-enricher';
import { useGasEstimation, useSophonContext } from '../../../../hooks';
import {
  type AddressSourceCode,
  type DecodedTransactionData,
  type EnrichedTransactionRequest,
  ERC20FunctionName,
  type TokenInfo,
  type TransactionCurrentRequest,
} from '../../../../types/transaction-request';
import { createApiClient } from '../../../../utils/api-client';
import {
  handleEnrichmentError,
  withTimeout,
} from './transaction-request-utils';

export function useTransactionUtils(
  transactionRequest: TransactionCurrentRequest | null,
) {
  const { chainId, chain } = useSophonContext();
  const apiClient = useMemo(
    () => createApiClient({ baseUrl: ExplorerAPIURL[chainId] }),
    [chainId],
  );

  const { estimateFee } = useGasEstimation({
    from: transactionRequest?.from as Address,
    to: transactionRequest?.to as Address,
    data: transactionRequest?.data,
    value: BigInt(transactionRequest?.value ?? '0'),
    chainId,
    enabled: false,
  });
  const getTokenBalance = useCallback(
    async (
      address: Address,
      contractAddress: string,
      signal?: AbortSignal,
    ): Promise<string | null> => {
      if (!isAddress(address) || !isAddress(contractAddress as Address)) {
        throw new Error('Invalid address provided');
      }

      try {
        const encodedContractAddress = encodeURIComponent(contractAddress);
        const encodedAddress = encodeURIComponent(address);

        const response = await apiClient.get<{ result?: string | null }>(
          `/api?module=account&action=tokenbalance&contractaddress=${encodedContractAddress}&address=${encodedAddress}`,
          undefined,
          signal,
        );

        return response?.result ?? null;
      } catch (error) {
        const enrichmentError = handleEnrichmentError(error);
        throw new Error(enrichmentError.message);
      }
    },
    [apiClient],
  );

  const getTokenFromAddress = useCallback(
    async (address?: Address, signal?: AbortSignal): Promise<TokenInfo> => {
      const defaultAddress = '0x000000000000000000000000000000000000800A';
      const targetAddress = address ?? defaultAddress;

      if (!isAddress(targetAddress)) {
        throw new Error('Invalid token address');
      }

      try {
        const response = await apiClient.get<{ result: TokenInfo[] }>(
          `/api?module=token&action=tokeninfo&contractaddress=${targetAddress}`,
          undefined,
          signal,
        );

        const info = response.result[0];
        return info as TokenInfo;
      } catch (error) {
        const enrichmentError = handleEnrichmentError(error);
        throw new Error(enrichmentError.message);
      }
    },
    [apiClient],
  );

  const getContractInfo = useCallback(
    async (
      address?: string,
      signal?: AbortSignal,
    ): Promise<ExplorerContractInfo> => {
      if (!address || !isAddress(address)) {
        return {
          abi: null,
          name: null,
          isVerified: false,
        };
      }

      try {
        const proxyImplementation = await withTimeout(
          getProxyImplementation(address, chain),
          signal,
        );

        const targetAddress = proxyImplementation || address;
        const encodedAddress = encodeURIComponent(targetAddress);

        const response = await apiClient.get<{
          result: AddressSourceCode[];
          status: string;
          message: string;
        }>(
          `/api?module=contract&action=getsourcecode&address=${encodedAddress}`,
          undefined,
          signal,
        );
        const result = response?.result?.[0];
        if (
          response.status === '1' &&
          result &&
          result.ABI !== 'Contract source code not verified'
        ) {
          return {
            abi: JSON.parse(result.ABI),
            name: result.ContractName,
            isVerified: true,
          };
        }
        return {
          abi: null,
          name: null,
          isVerified: false,
        };
      } catch {
        return {
          abi: null,
          name: null,
          isVerified: false,
        };
      }
    },
    [apiClient, chain],
  );

  const calculateFee = useCallback(
    async (
      sophTokenDetails: TokenInfo,
      signal?: AbortSignal,
    ): Promise<{ SOPH: string; USD: string } | undefined> => {
      if (
        transactionRequest?.paymaster &&
        transactionRequest.paymaster !== '0x'
      ) {
        return undefined;
      }

      const feeEstimate = await withTimeout(estimateFee(), signal);
      const feeSOPH = formatEther(feeEstimate || BigInt(0)).slice(0, 8);
      const feeUSD =
        sophTokenDetails &&
        !Number.isNaN(Number(sophTokenDetails?.tokenPriceUSD))
          ? (Number(feeSOPH) * Number(sophTokenDetails?.tokenPriceUSD)).toFixed(
              3,
            )
          : '0.000';

      return {
        SOPH: feeSOPH,
        USD: feeUSD,
      };
    },
    [transactionRequest?.paymaster, estimateFee],
  );

  const enrichSOPHTransfer = useCallback(
    async (
      request: TransactionCurrentRequest,
      sophTokenDetails: TokenInfo,
      fee?: { SOPH: string; USD: string },
    ): Promise<EnrichedTransactionRequest> => {
      console.warn('EnrichSOPHTransfer called');
      return enrichSOPHTransaction(request, sophTokenDetails, fee);
    },
    [],
  );

  const enrichERC20Transfer = useCallback(
    async (
      request: TransactionCurrentRequest,
      token: TokenInfo,
      fee?: { SOPH: string; USD: string },
    ): Promise<EnrichedTransactionRequest> => {
      return enrichERC20Transaction(request, token, fee);
    },
    [],
  );

  const enrichERC20Approval = useCallback(
    async (
      request: TransactionCurrentRequest,
      token: TokenInfo,
      decodedData: DecodedTransactionData,
      fee?: { SOPH: string; USD: string },
      signal?: AbortSignal,
    ): Promise<EnrichedTransactionRequest> => {
      const spenderAddress = decodedData?.args[0]?.value?.toString();
      if (!spenderAddress || !isAddress(spenderAddress)) {
        throw new Error('Invalid spender address in approval');
      }

      const [spenderContractInfo, currentBalance] = await Promise.all([
        getContractInfo(spenderAddress, signal),
        getTokenBalance(request.to, token?.contractAddress || '', signal),
      ]);

      return enrichApprovalTransaction(
        request,
        token,
        decodedData,
        spenderContractInfo,
        currentBalance,
        fee,
      );
    },
    [getContractInfo, getTokenBalance],
  );

  const enrichContractInteraction = useCallback(
    async (
      request: TransactionCurrentRequest,
      contractInfo: ExplorerContractInfo,
      decodedData?: DecodedTransactionData | null,
      fee?: { SOPH: string; USD: string },
    ): Promise<EnrichedTransactionRequest> => {
      return enrichContractTransaction(request, contractInfo, decodedData, fee);
    },
    [],
  );

  const enrichNonSOPHTransaction = useCallback(
    async (
      request: TransactionCurrentRequest,
      sophTokenDetails: TokenInfo,
      fee?: { SOPH: string; USD: string },
      signal?: AbortSignal,
    ): Promise<EnrichedTransactionRequest> => {
      // Optimize: Only fetch what we need based on transaction type
      console.warn('EnrichNonSOPHTransaction called');
      const isSophTransfer = request.data === '0x';
      if (isSophTransfer) {
        return enrichSOPHTransfer(request, sophTokenDetails, fee);
      }

      const contractInfo = await getContractInfo(request.to, signal);

      const decodedData = await decodeTransactionData(request, contractInfo);

      const isERC20Function =
        decodedData?.functionName === ERC20FunctionName.TRANSFER ||
        decodedData?.functionName === ERC20FunctionName.APPROVE;

      let token: TokenInfo | null = null;
      if (isERC20Function || !contractInfo.isVerified) {
        try {
          token = await getTokenFromAddress(request.to, signal);
        } catch (_error) {
          console.error('Error fetching token info:', _error);
          // Not an ERC20 token
          token = null;
        }
      }
      console.warn(
        'EnrichNonSOPHTransaction called = decodedData',
        token,
        decodedData,
        isERC20Function,
      );

      if (
        token &&
        (!decodedData ||
          decodedData?.functionName === ERC20FunctionName.TRANSFER)
      ) {
        return enrichERC20Transfer(request, token, fee);
      }

      if (
        token &&
        decodedData &&
        decodedData?.functionName === ERC20FunctionName.APPROVE
      ) {
        return enrichERC20Approval(request, token, decodedData, fee, signal);
      }

      return enrichContractInteraction(request, contractInfo, decodedData, fee);
    },
    [
      getContractInfo,
      getTokenFromAddress,
      enrichSOPHTransfer,
      enrichERC20Transfer,
      enrichERC20Approval,
      enrichContractInteraction,
    ],
  );

  const openExplorerAddress = useCallback(
    (address?: string) => {
      const blockExplorerURL = `${BlockExplorerURL[chainId]}/address/${address}`;

      Linking.openURL(blockExplorerURL).catch((err) => console.error(err));
    },
    [chainId],
  );

  return {
    // Core utilities
    getTokenBalance,
    getTokenFromAddress,
    getContractInfo,
    openExplorerAddress,

    // Enrichment helpers
    calculateFee,

    // Transaction enrichers
    enrichSOPHTransfer,
    enrichERC20Transfer,
    enrichERC20Approval,
    enrichContractInteraction,
    enrichNonSOPHTransaction,
  };
}

export type UseTransactionHelpers = ReturnType<typeof useTransactionUtils>;
