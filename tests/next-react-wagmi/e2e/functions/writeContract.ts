import { erc20Abi, parseUnits } from 'viem';
import { unverifiedAbi } from './abi/unverified';
import { verifiedAbi } from './abi/verified';
import type { AccountServerTestCase } from './types';

export const writeContractMintTestCase: AccountServerTestCase<'writeContract'> =
  {
    name: 'writeContract-erc20-mint',
    method: 'writeContract',
    payload: {
      address: process.env.NEXT_PUBLIC_TOKEN_ERC20_TOKEN as `0x${string}`,
      abi: [
        ...erc20Abi,
        {
          inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'mint',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'mint',
      args: [parseUnits('10', 18)],
    },
    accountServerActions: async (page) => {
      await page
        .locator('text=Transaction Request')
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

export const writeContractTransferTestCase: AccountServerTestCase<'writeContract'> =
  {
    name: 'writeContract-erc20-transfer',
    method: 'writeContract',
    payload: {
      address: process.env.NEXT_PUBLIC_TOKEN_ERC20_TOKEN as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [
        process.env.TRANSFER_TARGET_WALLET as `0x${string}`,
        parseUnits('0.01', 18),
      ],
    },
    accountServerActions: async (page) => {
      await page
        .locator(`text=Transfer ${process.env.TOKEN_ERC20_SYMBOL}`)
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

export const writeContractApproveTestCase: AccountServerTestCase<'writeContract'> =
  {
    name: 'writeContract-erc20-approve',
    method: 'writeContract',
    payload: {
      address: process.env.NEXT_PUBLIC_TOKEN_ERC20_TOKEN as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        process.env.TRANSFER_TARGET_WALLET as `0x${string}`,
        parseUnits('0.01', 18),
      ],
    },
    accountServerActions: async (page) => {
      await page
        .locator(`text=Spending request for ${process.env.TOKEN_ERC20_SYMBOL}`)
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

export const writeContractUnverifiedTestCase: AccountServerTestCase<'writeContract'> =
  {
    name: 'writeContract-unverified',
    method: 'writeContract',
    payload: {
      address: process.env.CONTRACT_UNVERIFIED_ADDRESS as `0x${string}`,
      abi: unverifiedAbi,
      functionName: 'setAll',
      args: ['anything', 100],
    },
    accountServerActions: async (page) => {
      await page
        .locator('text=Transaction Request')
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

export const writeContractVerifiedSimpleTestCase: AccountServerTestCase<'writeContract'> =
  {
    name: 'writeContract-verified-simple',
    method: 'writeContract',
    payload: {
      address: process.env.CONTRACT_VERIFIED_ADDRESS as `0x${string}`,
      abi: verifiedAbi,
      functionName: 'setString',
      args: ['Hello Verified Contract'],
    },
    accountServerActions: async (page) => {
      await page
        .locator('text=Transaction Request')
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

export const writeContractVerifiedComplexTestCase: AccountServerTestCase<'writeContract'> =
  {
    name: 'writeContract-verified-complex',
    method: 'writeContract',
    payload: {
      address: process.env.CONTRACT_VERIFIED_ADDRESS as `0x${string}`,
      abi: verifiedAbi,
      functionName: 'setStruct',
      args: [
        'Hello Complex Call',
        {
          testString: 'Hello Complex Struct',
          testNumber: 0o020,
          testAddress: '0x0000000000000000000000000000000000000000',
          testBool: true,
        },
      ],
    },
    accountServerActions: async (page) => {
      await page
        .locator('text=Transaction Request')
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };
