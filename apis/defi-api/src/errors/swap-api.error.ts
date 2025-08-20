export enum ErrorCodes {
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  UNSUPPORTED_ROUTE = 'UNSUPPORTED_ROUTE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_KEY_ERROR = 'API_KEY_ERROR',
}

export class SwapAPIError extends Error {
  constructor(
    message: string,
    public code: ErrorCodes,
    public provider?: string,
    public originalError?: any,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'SwapAPIError';
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        provider: this.provider,
        statusCode: this.statusCode,
      },
    };
  }
}