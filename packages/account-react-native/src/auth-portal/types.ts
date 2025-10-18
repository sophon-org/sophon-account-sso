import type { DataScopes } from "@sophon-labs/account-core";
import type { ViewStyle } from "react-native";

export enum AuthPortalSteps {
  SignIn = "signIn",
  VerifyCode = "verifyCode",
  ConnectWallet = "connectWallet",
  Authorization = "authorization",
  Loading = "loading",
  Retry = "retry",
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
  setParams: (params: Record<string, any>) => void;
  stepItemWidth: number;
  params: Record<string, any> | null;
};

export type AuthPortalContextType = AuthPortalContextProps & AuthPortalProps;

/// Navigation

export type NavigateOptions = {
  replace?: boolean;
  params?: Record<string, any>;
  inheritParamsFrom?: AuthPortalStep[];
};
export type SignInParams = {
  email?: string;
};

export type VerifyCodeParams = {
  email: string;
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
