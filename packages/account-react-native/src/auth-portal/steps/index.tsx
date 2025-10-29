import { memo } from 'react';
import { AuthPortalSteps, type BasicStepProps } from '../types';
import { AuthorizationStep } from './authorization-step';
import { ConsentStep } from './consent-step';
import { LoadingStep } from './loading-step';
import { RetryStep } from './retry-step';
import { SignInStep } from './sign-in-step';
import { SignMessageStep } from './sign-message';
import { TransactionStep } from './transaction-step';
import { VerifyEmailStep } from './verify-email-step';

const stepComponents: Record<
  AuthPortalSteps,
  React.ComponentType<BasicStepProps>
> = {
  [AuthPortalSteps.SignIn]: SignInStep,
  [AuthPortalSteps.VerifyEmail]: VerifyEmailStep,
  [AuthPortalSteps.Loading]: LoadingStep,
  [AuthPortalSteps.Authorization]: AuthorizationStep,
  [AuthPortalSteps.Transaction]: TransactionStep,
  [AuthPortalSteps.Consent]: ConsentStep,
  [AuthPortalSteps.SignMessage]: SignMessageStep,
  [AuthPortalSteps.Retry]: RetryStep,
  [AuthPortalSteps.ConnectWallet]:
    null as unknown as React.ComponentType<BasicStepProps>,
} as const;

export const StepControllerComponent = memo(
  (props: BasicStepProps) => {
    if (!props?.currentStep) {
      return null;
    }

    const StepComponent = stepComponents[props?.currentStep || ''];

    if (!StepComponent) {
      return null;
    }

    return <StepComponent {...props} />;
  },
  (prevProps, nextProps) => {
    return prevProps?.currentStep === nextProps?.currentStep;
  },
);
