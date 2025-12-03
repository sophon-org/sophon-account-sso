// Transaction Request specific navigation types

export enum TransactionRequestSteps {
  Transaction = 'transaction',
  TransactionDetails = 'transactionDetails',
}

export type TransactionRequestStep = `${TransactionRequestSteps}`;

export type TransactionDetailsParams = {
  rawTransaction?: string;
  feeDetails?: {
    networkFee?: string;
    usdFee?: string;
  };
};

export type TransactionRequestParams = {
  [TransactionRequestSteps.Transaction]?: undefined;
  [TransactionRequestSteps.TransactionDetails]?: TransactionDetailsParams;
};

export type TransactionRequestParamsUnion =
  | TransactionRequestParams
  | TransactionDetailsParams;
