import type { DataScopes } from '@sophon-labs/account-core';
import type { PartnerConfigSchema } from '@sophon-labs/account-partner';
import type { ViewStyle } from 'react-native';

export enum AuthPortalSteps {
  SignIn = 'signIn',
  VerifyEmail = 'verifyEmail',
  ConnectWallet = 'connectWallet',
  Authorization = 'authorization',
  Loading = 'loading',
  Retry = 'retry',
  SignMessage = 'signMessage',
  Transaction = 'transaction',
  Consent = 'consent',
}
export type AuthPortalStep = `${AuthPortalSteps}`;

export type AuthPortalContextProps = {
  currentStep: AuthPortalStep | null;
  navigate: (step: AuthPortalStep, options?: NavigateOptions) => void;
  goBack: () => void;
  onCloseAndForceCancel: () => void;
  setParams: (params: NavigateParams) => void;
  params: NavigateParams | null;
  handleProps: {
    showBackButton: boolean;
    hideCloseButton: boolean;
    title: string;
  };
};

interface OnAuthenticateOptions {
  provider?: string;
  from?: AuthPortalStep;
}
export interface BasicStepProps {
  currentStep: AuthPortalContextProps['currentStep'];
  style?: ViewStyle;
  scopes?: DataScopes[];
  partner?: PartnerConfigSchema | null;
  onAuthenticate: (
    value: `0x${string}`,
    options?: OnAuthenticateOptions,
  ) => Promise<void>;
  onComplete: (payload: { hide: boolean }) => Promise<void>;
  onBackToSignIn: () => Promise<void>;
  onCancel: () => Promise<void>;
  onError: (error: Error, step?: AuthPortalStep) => Promise<void>;
}

export type AuthPortalContextType = AuthPortalContextProps;

/// Navigation

export type SignInParams = {
  email?: string;
};

export type VerifyCodeParams = {
  email: string;
};

export type RetryParams = {
  ownerAddress: `0x${string}`;
  provider?: string;
};
export type LoadingParams = {
  provider?: string;
  from?: AuthPortalStep;
};

export type NavigateParams =
  | SignInParams
  | VerifyCodeParams
  | RetryParams
  | LoadingParams;

export type NavigateOptions = {
  replace?: boolean;
  params?: NavigateParams;
  inheritParamsFrom?: AuthPortalStep[];
};

export type CurrentParams = {
  [AuthPortalSteps.SignIn]?: SignInParams;
  [AuthPortalSteps.VerifyEmail]?: VerifyCodeParams;
  [AuthPortalSteps.Loading]?: LoadingParams;
  [AuthPortalSteps.Retry]?: RetryParams;
  [AuthPortalSteps.ConnectWallet]?: undefined;
  [AuthPortalSteps.Authorization]?: undefined;
  [AuthPortalSteps.SignMessage]?: undefined;
  [AuthPortalSteps.Transaction]?: undefined;
  [AuthPortalSteps.Consent]?: undefined;
};

export type NavigationAuthPortalState = {
  currentState: AuthPortalStep | null;
  history: AuthPortalStep[];
  currentParams: CurrentParams | null;
};
