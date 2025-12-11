import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from 'react';
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
  transactionCurrentStep: TransactionRequestStep;
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

  return (
    <TransactionRequestContext.Provider
      value={{
        ...transactionRequestHook,
        transactionCurrentStep,
        onViewFeeDetailsPress,
        onViewTransactionDetailsPress,
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
