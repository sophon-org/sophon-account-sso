import { callTestCase } from './call';
import { estimateGasSimpleTestCase } from './estimateGas';
import { getBalanceTestCase } from './getBalance';
import { getBlockByHashTestCase, getBlockByNumberTestCase } from './getBlock';
import { getBlockNumberTestCase } from './getBlockNumber';
import { getBytecodeTestCase } from './getBytecode';
import { getChainIdTestCase } from './getChainId';
import { getGasPriceTestCase } from './getGasPrice';
import { getStorageAtTestCase } from './getStorageAt';
import { getTransactionByHashTestCase } from './getTransactionByHash';
import { getTransactionCountTestCase } from './getTransactionCount';
import { getTransactionReceiptTestCase } from './getTransactionReceipt';
import { mintPaidNFTTestCase, mintSimpleNFTTestCase } from './mintNFTs';
import {
  sendTransactionAsFunctionCallTestCase,
  sendTransactionSOPTestCase,
} from './sendTransaction';
import { signMessageTestCase } from './signMessage';
import { signTypedDataTestCase } from './signTypedData';
import { switchChainTestCase } from './switchChain';
import {
  writeContractApproveTestCase,
  writeContractMintTestCase,
  writeContractTransferTestCase,
  writeContractUnverifiedTestCase,
  writeContractVerifiedComplexTestCase,
  writeContractVerifiedSimpleTestCase,
} from './writeContract';

export const accountServerTestCases = [
  signMessageTestCase,
  signTypedDataTestCase,
  mintSimpleNFTTestCase,
  mintPaidNFTTestCase,
  sendTransactionSOPTestCase,
  writeContractMintTestCase,
  writeContractTransferTestCase,
  writeContractApproveTestCase,
  writeContractUnverifiedTestCase,
  writeContractVerifiedSimpleTestCase,
  writeContractVerifiedComplexTestCase,
  sendTransactionAsFunctionCallTestCase,
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
  estimateGasSimpleTestCase,
  getBytecodeTestCase,
  getStorageAtTestCase,
  callTestCase,
];
