import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { type Address, parseUnits } from 'viem';
import { useERC20Approval } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import { StepTransitionView } from '../../components/step-transition';
import { useAuthPortal } from '../../hooks';
import { useNavigationParams } from '../../navigation';
import type { TransactionParams } from '../../types';
import { TransactionDetailsStep } from './components/transaction-details-step';
import { type TransactionRequestStep, TransactionRequestSteps } from './types';
import {
  type UseTransactionRequestHook,
  useTransactionRequest,
} from './use-transaction-request';

interface TransactionRequestContextProps extends UseTransactionRequestHook {
  onViewFeeDetailsPress: () => void;
  onViewTransactionDetailsPress: () => void;
  onViewErrorDetailsPress: (error: Error) => void;
  transactionCurrentStep: TransactionRequestStep;
  isApproveLoading?: boolean;
  approveError: Error | null;
  approve: () => void;
}

const TransactionRequestContext = createContext<TransactionRequestContextProps>(
  {} as TransactionRequestContextProps,
);

export function TransactionRequestProvider(props: PropsWithChildren) {
  const { setParams } = useAuthPortal();

  const navigationParams = useNavigationParams<TransactionParams>();
  const { t } = useTranslation();

  const transactionRequestHook = useTransactionRequest();

  const onSetNavigationParams = useCallback(
    (params: Partial<TransactionParams>) => {
      const currentParams = {
        currentStep: 'transactionDetails',
        hideCloseButton: true,
        showBackButton: true,
        ...params,
      } as TransactionParams;
      setParams(currentParams, 'transaction');
    },
    [setParams],
  );

  const onViewTransactionDetailsPress = useCallback(() => {
    const params = {
      rawTransaction: JSON.stringify(
        transactionRequestHook.transactionRequest,
        null,
        2,
      ),
      stepTitle: t('transactionStep.rawTransaction'),
    };
    onSetNavigationParams(params);
  }, [transactionRequestHook.transactionRequest, t, onSetNavigationParams]);

  const onViewFeeDetailsPress = useCallback(() => {
    const params = {
      feeDetails: {
        networkFee:
          transactionRequestHook?.enrichedTransactionRequest?.fee?.SOPH,
        usdFee: transactionRequestHook?.enrichedTransactionRequest?.fee?.USD,
      },
      stepTitle: t('transactionStep.feeDetails'),
    };
    onSetNavigationParams(params);
  }, [
    transactionRequestHook.enrichedTransactionRequest?.fee,
    t,
    onSetNavigationParams,
  ]);

  const onViewErrorDetailsPress = useCallback(
    (error: Error) => {
      const params = {
        rawTransaction: JSON.stringify(error, null, 2),
        stepTitle: t('transactionStep.errorDetails'),
      };
      onSetNavigationParams(params);
    },
    [t, onSetNavigationParams],
  );

  const transactionCurrentStep = useMemo(() => {
    return navigationParams?.currentStep as TransactionRequestStep;
  }, [navigationParams?.currentStep]);

  const renderStepComponent = useCallback(() => {
    switch (transactionCurrentStep) {
      case TransactionRequestSteps.TransactionDetails:
        return <TransactionDetailsStep />;
      default:
        return <>{props.children}</>;
    }
  }, [props.children, transactionCurrentStep]);

  const isBackAvailable = Boolean(transactionCurrentStep);

  // Extract correct approval parameters from enriched transaction
  const approvalParams = useMemo(() => {
    const enrichedTransactionRequest =
      transactionRequestHook?.enrichedTransactionRequest;
    const spender =
      enrichedTransactionRequest && 'spender' in enrichedTransactionRequest
        ? enrichedTransactionRequest?.spender
        : undefined;
    const spendingCapStr = spender?.spendingCap || '0';
    const spendingCapValue = spendingCapStr.split(' ')[0];

    // Convert to wei/smallest units using token decimals
    const decimals = Number(
      enrichedTransactionRequest?.token?.tokenDecimal || 18,
    );
    const spendingCapBigInt = parseUnits(spendingCapValue ?? '0', decimals);
    return {
      tokenAddress: enrichedTransactionRequest?.token
        ?.contractAddress as Address,
      spender: spender?.address as Address,
      amount: spendingCapBigInt,
    };
  }, [transactionRequestHook?.enrichedTransactionRequest]);

  const {
    isLoading: isApproveLoading,
    approve,
    error: approveError,
  } = useERC20Approval({
    tokenAddress: approvalParams.tokenAddress,
    spender: approvalParams.spender,
    amount: approvalParams.amount,
    onError: onViewErrorDetailsPress,
  });

  return (
    <TransactionRequestContext.Provider
      value={{
        ...transactionRequestHook,
        transactionCurrentStep,
        onViewFeeDetailsPress,
        onViewTransactionDetailsPress,
        onViewErrorDetailsPress,
        isApproveLoading,
        approve,
        approveError,
      }}
    >
      <StepTransitionView
        keyProp={transactionCurrentStep}
        isBackAvailable={isBackAvailable}
        disableAnimation={!transactionCurrentStep}
      >
        {renderStepComponent()}
      </StepTransitionView>
    </TransactionRequestContext.Provider>
  );
}

export const useTransactionRequestContext = () =>
  useContext(TransactionRequestContext);
