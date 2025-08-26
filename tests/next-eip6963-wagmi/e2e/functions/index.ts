import { getBalanceTestCase } from './getBalance';
import { getBlockByHashTestCase, getBlockByNumberTestCase } from './getBlock';
import { getBlockNumberTestCase } from './getBlockNumber';
import { getChainIdTestCase } from './getChainId';
import { getGasPriceTestCase } from './getGasPrice';
import { getTransactionByHashTestCase } from './getTransactionByHash';
import { getTransactionCountTestCase } from './getTransactionCount';
import { getTransactionReceiptTestCase } from './getTransactionReceipt';
import { mintPaidNFTTestCase, mintSimpleNFTTestCase } from './mintNFTs';
import { signMessageTestCase } from './signMessage';
import { signTypedDataTestCase } from './signTypedData';
import { switchChainTestCase } from './switchChain';

export const accountServerTestCases = [
  signMessageTestCase,
  signTypedDataTestCase,
  mintSimpleNFTTestCase,
  mintPaidNFTTestCase,
];

export const directCallTestCases = [
  getChainIdTestCase,
  switchChainTestCase,
  getBalanceTestCase,
  getGasPriceTestCase,
  getBlockNumberTestCase,
  getBlockByHashTestCase,
  getBlockByNumberTestCase,
  getTransactionCountTestCase,
  getTransactionByHashTestCase,
  getTransactionReceiptTestCase,
];
