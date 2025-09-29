/*
 * Defines the actions and payloads that the web app can send to the native app
 */
export type FromWebActions = {
  echo: {
    message: string;
  };
  connected: {
    address: string;
  };
  closeModal: unknown;
  logout: unknown;
  rpc: {
    id: string;
    requestId: string;
    content: unknown;
  };
  sdkStatusResponse: {
    isDrawerOpen: boolean;
    isReady: boolean;
    isAuthenticated: boolean;
    connectedAccount?: string;
  };
  'account.access.token.emitted': { value: string; expiresAt: number };
  'account.refresh.token.emitted': { value: string; expiresAt: number };
};

export type FromWebActionNames = keyof FromWebActions;

/*
 * Defines the actions and payloads that the native app can send to the web app
 */
export type FromNativeActions = {
  echo: {
    message: string;
  };
  authSessionRedirect: {
    url: string;
  };
  authSessionCancel: unknown;
  sdkStatusRequest: unknown;
  openModal: unknown;
  closeModal: unknown;
  rpc: {
    id: string;
    requestId: string;
    content: unknown;
  };
};

export type FromNativeActionNames = keyof FromNativeActions;
