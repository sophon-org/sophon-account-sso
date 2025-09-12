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
  // biome-ignore lint/suspicious/noExplicitAny: parameters may be any
  on(eventName: string, callback: (...args: any[]) => void): void;

  /**
   * The removeListener method is intended as a transport- and protocol-agnostic wrapper function for event listeners.
   * Usually it should be simply extended from node EventEmitter api.
   *
   * @param eventName - The event name.
   * @param callback - The callback function.
   */
  removeListener(
    eventName: string,
    // biome-ignore lint/suspicious/noExplicitAny: parameters may be any
    callback: (...args: any[]) => void,
  ): void;

  /**
   * Additional method to disconnect the provider.
   */
  disconnect(): Promise<void>;

  accounts: () => string[];
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
