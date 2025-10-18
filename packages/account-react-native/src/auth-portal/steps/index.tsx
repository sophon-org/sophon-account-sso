import { AuthPortalSteps, type BasicStepProps } from "../types";
import { LoadingStep } from "./loading-step";
import { SignInStep } from "./sign-in.step";
import { VerifyCodeStep } from "./verify-code-step";
import { AuthorizationStep } from "./authorization-step";

export const StepControllerComponent = (props: BasicStepProps) => {
  switch (props?.step) {
    case AuthPortalSteps.SignIn:
      return <SignInStep {...props} />;
    case AuthPortalSteps.VerifyCode:
      return <VerifyCodeStep {...props} />;
    case AuthPortalSteps.Loading:
      return <LoadingStep />;
    case AuthPortalSteps.Authorization:
      return <AuthorizationStep {...props} />;
    default:
      return null;
  }
};
