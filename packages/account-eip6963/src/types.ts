export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  request: (payload: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<unknown>;
  // biome-ignore lint/suspicious/noExplicitAny: TODO: Review this
  on(eventName: string, callback: (...args: any[]) => void): void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}
