/**
 * The EIP-6963 provider info according to the specification.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export interface EIP6963ProviderInfo {
  /**
   * The unique identifier of the wallet provider.
   */
  uuid: string;

  /**
   * The name of the wallet provider.
   */
  name: string;

  /**
   * The icon of the wallet provider. According to the specification, it should be an URI pointing to an image.
   *
   * The image SHOULD be a square with 96x96px minimum resolution. See the Images/Icons below for further requirements of this property.
   */
  icon: string;

  /**
   * The rDNS of the wallet provider.
   */
  rdns: string;
}

/**
 * The request arguments according to the specification.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1193#request
 */
export interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[];
}

/**
 * The EIP-1193 provider according to the specification.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1193
 */
export interface EIP1193Provider {
  /**
   * The request method is intended as a transport- and protocol-agnostic wrapper function for Remote Procedure Calls (RPCs).
   *
   * @param payload - The request payload.
   * @returns The response from the provider.
   */
  request: (payload: RequestArguments) => Promise<unknown>;

  /**
   * The on method is intended as a transport- and protocol-agnostic wrapper function for event listeners.
   * Usually it should be simply extended from node EventEmitter api.
   *
   * @param eventName - The event name.
   * @param callback - The callback function.
   */
  on(eventName: string, callback: (...args: unknown[]) => void): void;

  /**
   * The removeListener method is intended as a transport- and protocol-agnostic wrapper function for event listeners.
   * Usually it should be simply extended from node EventEmitter api.
   *
   * @param eventName - The event name.
   * @param callback - The callback function.
   */
  removeListener(
    eventName: string,
    callback: (...args: unknown[]) => void,
  ): void;
}

/**
 * The EIP-6963 provider detail according to the specification.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export interface EIP6963ProviderDetail {
  /**
   * General information about the wallet provider.
   */
  info: EIP6963ProviderInfo;

  /**
   * The actual provider implementation.
   */
  provider: EIP1193Provider;
}

export type RequestSender<T> = (
  method: string,
  params?: unknown[],
) => Promise<RPCResponse<T>>;

export interface RPCResponse<T> {
  id: string;
  requestId: string;
  content: {
    result?: T;
    error?: {
      code: number;
      message: string;
    };
  };
}
