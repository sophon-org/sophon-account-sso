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
};

export type FromWebActionNames = keyof FromWebActions;

/*
 * Defines the actions and payloads that the native app can send to the web app
 */
export type FromNativeActions = {
  echo: {
    message: string;
  };
  openModal: unknown;
  rpc: {
    id: string;
    requestId: string;
    content: unknown;
  };
};

export type FromNativeActionNames = keyof FromNativeActions;
