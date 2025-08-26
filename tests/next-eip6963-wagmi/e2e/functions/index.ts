import { getChainIdTestCase } from './getChainId';
import { signMessageTestCase } from './signMessage';
import { signTypedDataTestCase } from './signTypedData';
import { switchChainTestCase } from './switchChain';

export const accountServerTestCases = [
  signMessageTestCase,
  signTypedDataTestCase,
];

export const directCallTestCases = [getChainIdTestCase, switchChainTestCase];
