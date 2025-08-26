import { parseEther } from 'viem';
import { nftAbi } from './abi/nft';
import type { AccountServerTestCase } from './types';

export const mintSimpleNFTTestCase: AccountServerTestCase<'writeContract'> = {
  name: 'writeContract-simpleNFT',
  method: 'writeContract',
  payload: {
    address: process.env.NFT_ADDRESS as `0x${string}`,
    abi: nftAbi,
    functionName: 'mint',
    args: [process.env.USER_WALLET as `0x${string}`],
  },
  accountServerActions: async (page) => {
    await page
      .locator('text=Transaction Request')
      .waitFor({ state: 'visible' });
    await page.screenshot();
    await page.getByTestId('transaction-accept-button').click();
  },
  isValidResponse: (response) => {
    return response?.startsWith('0x');
  },
};

export const mintPaidNFTTestCase: AccountServerTestCase<'writeContract'> = {
  name: 'writeContract-paidNFT',
  method: 'writeContract',
  payload: {
    address: process.env.NFT_ADDRESS as `0x${string}`,
    abi: nftAbi,
    functionName: 'paidMint',
    value: parseEther('1') as unknown as undefined,
    args: [process.env.USER_WALLET as `0x${string}`],
  },
  accountServerActions: async (page) => {
    await page
      .locator('text=Transaction Request')
      .waitFor({ state: 'visible' });
    await page.screenshot();
    await page.getByTestId('transaction-accept-button').click();
  },
  isValidResponse: (response) => {
    return response?.startsWith('0x');
  },
};
