import type { DataScopes } from '@sophon-labs/account-core';
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

export type AuthPortalProps = {
  debugEnabled?: boolean;
  insets?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  authServerUrl?: string;
  partnerId: string;
  scopes: DataScopes[];
};

export interface BasicStepProps {
  step?: AuthPortalStep | null;
  style?: ViewStyle;
  onComplete: (payload: { hide: boolean }) => Promise<void>;
  onCancel: () => Promise<void>;
  onError: (error: Error) => Promise<void>;
}

export type AuthPortalContextProps = {
  currentStep: AuthPortalStep | null;
  navigate: (step: AuthPortalStep, options?: NavigateOptions) => void;
  goBack: () => void;
  setParams: (params: NavigateParams) => void;
  params: NavigateParams | null;
};

export type AuthPortalContextType = AuthPortalContextProps & AuthPortalProps;

/// Navigation

export type SignInParams = {
  email?: string;
};

export type VerifyCodeParams = {
  email: string;
};

export type NavigateParams = SignInParams | VerifyCodeParams;

export type NavigateOptions = {
  replace?: boolean;
  params?: NavigateParams;
  inheritParamsFrom?: AuthPortalStep[];
};

export type CurrentParams = {
  signIn?: SignInParams;
  verifyCode?: VerifyCodeParams;
};

export type NavigationAuthPortalState = {
  currentState: AuthPortalStep;
  history: AuthPortalStep[];
  currentParams: CurrentParams | null;
};
