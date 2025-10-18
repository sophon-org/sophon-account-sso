import { AuthPortalSteps, type BasicStepProps } from '../types';
import { AuthorizationStep } from './authorization-step';
import { ConsentStep } from './consent-step';
import { LoadingStep } from './loading-step';
import { SignInStep } from './sign-in-step';
import { SignMessageStep } from './sign-message';
import { TransactionStep } from './transaction-step';
import { VerifyEmailStep } from './verify-email-step';

export const StepControllerComponent = (props: BasicStepProps) => {
  console.log('Rendering step:', props?.currentStep);
  switch (props?.currentStep) {
    case AuthPortalSteps.SignIn:
      return <SignInStep {...props} />;
    case AuthPortalSteps.VerifyEmail:
      return <VerifyEmailStep {...props} />;
    case AuthPortalSteps.Loading:
      return <LoadingStep />;
    case AuthPortalSteps.Authorization:
      return <AuthorizationStep {...props} />;
    case AuthPortalSteps.Transaction:
      return <TransactionStep {...props} />;
    case AuthPortalSteps.Consent:
      return <ConsentStep {...props} />;
    case AuthPortalSteps.SignMessage:
      return <SignMessageStep {...props} />;
    default:
      return null;
  }
};
