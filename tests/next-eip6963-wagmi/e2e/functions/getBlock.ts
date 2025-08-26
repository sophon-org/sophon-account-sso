import type { TestCase } from './types';

export const getBlockByHashTestCase: TestCase<'getBlock'> = {
  name: 'getBlock-byHash',
  method: 'getBlock',
  payload: { blockHash: process.env.FIRST_BLOCK_HASH as `0x${string}` },
  isValidResponse: (response) => {
    return response?.number === BigInt(1);
  },
};

export const getBlockByNumberTestCase: TestCase<'getBlock'> = {
  name: 'getBlock-byNumber',
  method: 'getBlock',
  payload: { blockNumber: BigInt(1) },
  isValidResponse: (response) => {
    return response?.hash === process.env.FIRST_BLOCK_HASH;
  },
};
