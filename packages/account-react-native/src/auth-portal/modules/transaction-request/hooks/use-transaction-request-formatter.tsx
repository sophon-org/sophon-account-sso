import { shortenAddress } from '@sophon-labs/account-core';
import { useMemo } from 'react';
import { useTranslation } from '../../../../i18n';
import { TransactionType } from '../../../../types/transaction-request';
import { Text } from '../../../../ui';
import { useTransactionRequestContext } from '../transaction-request.context';
import {
  formatDecodeArgsValue,
  truncateContractName,
} from '../utils/transaction-request-utils';

export function useTransactionRequestFormatter() {
  const { t } = useTranslation();
  const { enrichedTransactionRequest } = useTransactionRequestContext();

  const transactionTitle = useMemo(() => {
    if (!enrichedTransactionRequest) return '';
    switch (enrichedTransactionRequest?.transactionType) {
      case TransactionType.SOPH:
        return t('transactionStep.transfer', {
          name:
            'token' in enrichedTransactionRequest
              ? enrichedTransactionRequest.token.symbol
              : 'SOPH',
        });
      case TransactionType.ERC20:
        return t('transactionStep.transfer', {
          name:
            'token' in enrichedTransactionRequest
              ? enrichedTransactionRequest.token.symbol
              : 'Token',
        });
      case TransactionType.APPROVE:
        return t('transactionStep.spendingRequestFor', {
          name:
            'token' in enrichedTransactionRequest
              ? enrichedTransactionRequest.token.symbol
              : 'Token',
        });
      case TransactionType.CONTRACT:
        return t('transactionStep.transactionRequest');

      default:
        return t('transactionStep.unknownTransaction');
    }
  }, [enrichedTransactionRequest, t]);

  const currentToken = useMemo(() => {
    return {
      name: enrichedTransactionRequest?.token?.tokenName || '',
      address: shortenAddress(enrichedTransactionRequest?.recipient) || '',
      recipient: enrichedTransactionRequest?.recipient,
    };
  }, [enrichedTransactionRequest]);

  const spenderParams = useMemo(() => {
    if (enrichedTransactionRequest && 'spender' in enrichedTransactionRequest) {
      return {
        contract: {
          name: truncateContractName(
            enrichedTransactionRequest.spender.name || '',
          ),
          address:
            shortenAddress(
              enrichedTransactionRequest.spender.address as `0x${string}`,
            ) || '',
          recipient: enrichedTransactionRequest.spender.address,
        },
        spendingCap: `${enrichedTransactionRequest.spender.spendingCap} ${enrichedTransactionRequest.token.symbol}`,
        currentBalance: `${enrichedTransactionRequest.token.currentBalance} ${enrichedTransactionRequest.token.symbol}`,
      };
    }
    return null;
  }, [enrichedTransactionRequest]);

  const interactingWith = useMemo(() => {
    if (
      enrichedTransactionRequest?.transactionType ===
        TransactionType.CONTRACT &&
      enrichedTransactionRequest?.decodedData
    ) {
      return {
        contract: {
          name: truncateContractName(
            enrichedTransactionRequest?.contractName || '',
          ),
          address: shortenAddress(enrichedTransactionRequest?.recipient) || '',
          recipient: enrichedTransactionRequest?.recipient,
        },
        data: enrichedTransactionRequest?.decodedData?.args?.map((it) => ({
          ...it,
          value: formatDecodeArgsValue(it),
        })),
      };
    }

    return null;
  }, [enrichedTransactionRequest]);

  const renderInteractingArgs = (
    item: NonNullable<typeof interactingWith>['data'][number],
  ) => {
    if (Array.isArray(item.value)) {
      return item.value.map((it) => (
        <Text fontWeight="bold" lineHeight={24} key={it.name}>
          • {it.name}: <Text fontWeight="400">{it.value}</Text>
        </Text>
      ));
    }

    return (
      <Text fontWeight="bold">
        • {item.name}: <Text fontWeight="400">{item.value}</Text>
      </Text>
    );
  };

  const transactionDisplay = useMemo(() => {
    return {
      value: `${enrichedTransactionRequest?.displayValue ?? '0'} ${enrichedTransactionRequest?.token?.symbol}`,
      feeSOPH: `${enrichedTransactionRequest?.fee?.SOPH} SOPH`,
      feeUSD: `${enrichedTransactionRequest?.fee?.USD} USD`,
    };
  }, [enrichedTransactionRequest]);

  return {
    transactionTitle,
    currentToken,
    spenderParams,
    interactingWith,
    renderInteractingArgs,
    transactionDisplay,
  };
}
