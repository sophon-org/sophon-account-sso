import type { DataScopes } from "@sophon-labs/account-core";

export type AuthBottomSheetStep = "signIn" | "authentication" | "code" | "connectWallet";

export type AuthBottomSheetProps = {
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

export type AuthSheetContextProps = {
  currentStep: AuthBottomSheetStep;
  goTo: (step: AuthBottomSheetStep) => void;
  goBack: () => void;
};

export type AuthSheetContextType = AuthSheetContextProps & AuthBottomSheetProps;
