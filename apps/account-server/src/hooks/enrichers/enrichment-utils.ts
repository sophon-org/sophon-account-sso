import { decodeAbiParameters, parseAbiParameters } from 'viem';
import { BLOCK_EXPLORER_API_URL } from '@/lib/constants';
import type { ContractInfo } from '@/types/auth';
import { getProxyImplementation } from './proxy-utils';

export const getTokenBalance = async (
  accountAddress: string,
  tokenAddress: string,
) => {
  try {
    const response = await fetch(
      `${BLOCK_EXPLORER_API_URL}/api?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${accountAddress}`,
    );
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.warn('Failed to fetch token balance:', error);
    return null;
  }
};

export const getTokenFromAddress = async (address: string) => {
  try {
    const response = await fetch(
      `${BLOCK_EXPLORER_API_URL}/api?module=token&action=tokeninfo&contractaddress=${address}`,
    );
    const data = await response.json();
    return data.result[0];
  } catch (error) {
    console.warn('Failed to fetch token info:', error);
    return null;
  }
};

export const getContractInfo = async (
  address: string,
): Promise<ContractInfo> => {
  try {
    const proxyImplementation = await getProxyImplementation(address);
    if (proxyImplementation) {
      address = proxyImplementation;
    }
    const response = await fetch(
      `${BLOCK_EXPLORER_API_URL}/api?module=contract&action=getsourcecode&address=${address}`,
    );

    const data = await response.json();

    if (
      data.status === '1' &&
      data.result &&
      data.result !== 'Contract source code not verified'
    ) {
      return {
        abi: JSON.parse(data.result[0].ABI),
        name: data.result[0].ContractName,
        isVerified: true,
      };
    }
    return {
      abi: null,
      name: null,
      isVerified: false,
    };
  } catch (error) {
    console.warn('Failed to fetch contract ABI:', error);
    return {
      abi: null,
      name: null,
      isVerified: false,
    };
  }
};

export const getFunctionParameters = (
  decodedData: { functionName: string; args: readonly unknown[] },
  contractInfo: ContractInfo,
): {
  functionName: string;
  args: Array<{ name: string; value: string; type: string }>;
} | null => {
  if (!contractInfo.abi) return null;

  const functionAbi = contractInfo.abi.find(
    (item) =>
      item.type === 'function' &&
      item.name === decodedData.functionName &&
      item.inputs?.length === decodedData.args.length,
  );

  if (functionAbi?.inputs) {
    const parameters = decodedData.args.map((arg: unknown, index: number) => {
      const type = functionAbi.inputs?.[index]?.type || 'unknown';
      let value = '';

      if (arg === null || arg === undefined) {
        value = '';
      } else if (typeof arg === 'bigint') {
        // Handle BigInt values
        value = arg.toString();
      } else if (typeof arg === 'object') {
        // For complex types like tuples/structs, use JSON representation with BigInt handling
        value = JSON.stringify(
          arg,
          (_key, val) => {
            // Convert BigInt to string in JSON
            return typeof val === 'bigint' ? val.toString() : val;
          },
          2,
        );
      } else {
        value = arg.toString();
      }

      return {
        name: functionAbi.inputs?.[index]?.name || `param${index}`,
        value,
        type,
      };
    });

    return {
      functionName: decodedData.functionName,
      args: parameters,
    };
  }

  return null;
};

const parseSignature = (signature: string) => {
  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) return null;

  const [, functionName, params] = match;
  const paramTypes = params ? params.split(',').map((p) => p.trim()) : [];

  return { functionName, paramTypes };
};

const decodeUnverifiedParameters = (
  data: string,
  paramTypes: string[],
): Array<{ name: string; value: string; type: string }> => {
  if (!paramTypes.length || data.length <= 10) return [];

  try {
    // Skip method ID (first 10 chars: 0x + 8 hex chars)
    const paramData = `0x${data.slice(10)}` as `0x${string}`;

    // Parse and decode parameters
    const abiParams = parseAbiParameters(paramTypes.join(','));
    const decoded = decodeAbiParameters(abiParams, paramData);

    return decoded.map((value, index) => {
      const type = paramTypes[index];
      let formattedValue = '';

      if (value === null || value === undefined) {
        formattedValue = '';
      } else if (typeof value === 'bigint') {
        formattedValue = value.toString();
      } else if (typeof value === 'object') {
        formattedValue = JSON.stringify(
          value,
          (_key, val) => (typeof val === 'bigint' ? val.toString() : val),
          2,
        );
      } else {
        formattedValue = value.toString();
      }

      return {
        name: `param${index}`,
        value: formattedValue,
        type,
      };
    });
  } catch (error) {
    console.warn('Failed to decode parameters:', error);
    return [];
  }
};

export const getOpenChainSignature = async (
  transactionData: string,
): Promise<{
  functionName: string;
  signature: string;
  paramTypes: string[];
  args: Array<{ name: string; value: string; type: string }>;
} | null> => {
  try {
    // Only proceed if we have enough data (at least method ID)
    if (!transactionData || transactionData.length < 10) {
      return null;
    }

    // Extract method ID (first 4 bytes after 0x)
    const methodId = transactionData.slice(0, 10);

    const response = await fetch(
      `https://api.openchain.xyz/signature-database/v1/lookup?function=${methodId}&filter=true`,
    );

    if (!response.ok) {
      return {
        functionName: methodId,
        signature: methodId,
        paramTypes: [],
        args: [],
      };
    }

    const data = await response.json();

    if (data.ok && data.result?.function?.[methodId]?.length > 0) {
      const fullSignature = data.result.function[methodId][0].name;

      const parsed = parseSignature(fullSignature);

      if (!parsed) {
        return {
          functionName: fullSignature,
          signature: fullSignature,
          paramTypes: [],
          args: [],
        };
      }

      const args = decodeUnverifiedParameters(
        transactionData,
        parsed.paramTypes,
      );

      return {
        functionName: parsed.functionName,
        signature: fullSignature,
        paramTypes: parsed.paramTypes,
        args,
      };
    }

    return {
      functionName: methodId,
      signature: methodId,
      paramTypes: [],
      args: [],
    };
  } catch (error) {
    console.warn('Failed to fetch OpenChain signature:', error);
    return null;
  }
};
