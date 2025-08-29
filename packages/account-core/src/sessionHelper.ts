import {
  type Address,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAbiItem,
  type Hex,
  http,
  keccak256,
} from 'viem';
import { type Chain, sophon, sophonTestnet } from 'viem/chains';
import { getGeneralPaymasterInput } from 'viem/zksync';
import { SessionKeyValidatorAbi } from './abis/SessionKeyValidatorAbi';
import { SophonAccountAbi } from './abis/SophonAccountAbi';
import { CHAIN_CONTRACTS, type ChainId } from './constants';
import type {
  CreateSessionArgs,
  InstallSessionKeyModuleArgs,
  RevokeSessionArgs,
  SessionConfig,
  SessionState,
  SessionStatus,
} from './types';

const SESSION_KEY_MODULE_ADDRESS = (chainId: ChainId) =>
  CHAIN_CONTRACTS[chainId].session;
const ALLOWED_SESSION_KEY_MODULE_ADDRESS = (chainId: ChainId) =>
  CHAIN_CONTRACTS[chainId].allowedSession;

const getSessionSpec = () => {
  return getAbiItem({
    abi: SessionKeyValidatorAbi,
    name: 'createSession',
  }).inputs[0];
};

export const encodeSession = (sessionConfig: SessionConfig) => {
  return encodeAbiParameters([getSessionSpec()], [sessionConfig]);
};

export function getSessionHash(sessionConfig: SessionConfig): `0x${string}` {
  return keccak256(encodeSession(sessionConfig));
}

export const getSessionActionsHash = (sessionSpec: SessionConfig) => {
  let callPoliciesEncoded: any;

  for (const callPolicy of sessionSpec.callPolicies) {
    callPoliciesEncoded = encodePacked(
      callPoliciesEncoded !== undefined
        ? [
            'bytes',
            'bytes20',
            'bytes4',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
          ]
        : ['bytes20', 'bytes4', 'uint256', 'uint256', 'uint256', 'uint256'],
      callPoliciesEncoded !== undefined
        ? [
            callPoliciesEncoded,
            callPolicy.target,
            callPolicy.selector,
            callPolicy.maxValuePerUse,
            BigInt(callPolicy.valueLimit.limitType),
            callPolicy.valueLimit.limit,
            callPolicy.valueLimit.period,
          ]
        : [
            callPolicy.target,
            callPolicy.selector,
            callPolicy.maxValuePerUse,
            BigInt(callPolicy.valueLimit.limitType),
            callPolicy.valueLimit.limit,
            callPolicy.valueLimit.period,
          ],
    );
  }

  return keccak256(
    encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { type: 'uint256', name: 'limitType' },
            { type: 'uint256', name: 'limit' },
            { type: 'uint256', name: 'period' },
          ],
        },
        {
          type: 'tuple[]',
          components: [
            { type: 'address', name: 'target' },
            { type: 'uint256', name: 'maxValuePerUse' },
            {
              type: 'tuple',
              components: [
                { type: 'uint256', name: 'limitType' },
                { type: 'uint256', name: 'limit' },
                { type: 'uint256', name: 'period' },
              ],
              name: 'valueLimit',
            },
          ],
        },
        { type: 'bytes', name: 'callPolicies' },
      ],
      // @ts-ignore
      [
        {
          limitType: BigInt(sessionSpec.feeLimit.limitType),
          limit: BigInt(sessionSpec.feeLimit.limit),
          period: BigInt(sessionSpec.feeLimit.period),
        },
        sessionSpec.transferPolicies.map((policy) => ({
          target: policy.target,
          maxValuePerUse: BigInt(policy.maxValuePerUse),
          valueLimit: {
            limitType: BigInt(policy.valueLimit.limitType),
            limit: BigInt(policy.valueLimit.limit),
            period: BigInt(policy.valueLimit.period),
          },
        })),
        callPoliciesEncoded || '',
      ],
    ),
  );
};

export async function getSessionState({
  accountAddress,
  sessionConfig,
  useAllowedSessions = true,
  useTestnet = true,
}: {
  accountAddress: Address;
  sessionConfig: SessionConfig;
  useAllowedSessions: boolean;
  useTestnet: boolean;
}): Promise<SessionState> {
  const client = createPublicClient({
    chain: useTestnet ? sophonTestnet : sophon,
    transport: http(),
  });

  const result = await client.readContract({
    address: useAllowedSessions
      ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
      : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
    abi: SessionKeyValidatorAbi,
    functionName: 'sessionState',
    args: [accountAddress, sessionConfig],
  });

  return result as SessionState;
}

export async function getSessionStatus({
  accountAddress,
  sessionConfig,
  useAllowedSessions,
  useTestnet,
}: {
  accountAddress: Address;
  sessionConfig: SessionConfig;
  useAllowedSessions: boolean;
  useTestnet: boolean;
}): Promise<SessionStatus>;

export async function getSessionStatus({
  accountAddress,
  sessionHash,
  useAllowedSessions,
  useTestnet,
}: {
  accountAddress: Address;
  sessionHash: `0x${string}`;
  useAllowedSessions: boolean;
  useTestnet: boolean;
}): Promise<SessionStatus>;

export async function getSessionStatus({
  accountAddress,
  sessionConfig,
  sessionHash,
  useAllowedSessions = true,
  useTestnet = true,
}: {
  accountAddress: Address;
  sessionConfig?: SessionConfig;
  sessionHash?: `0x${string}`;
  useAllowedSessions: boolean;
  useTestnet: boolean;
}): Promise<SessionStatus> {
  const client = createPublicClient({
    chain: useTestnet ? sophonTestnet : sophon,
    transport: http(),
  });

  const hash = sessionHash ?? getSessionHash(sessionConfig!);

  // Call the getState function on the session key module
  const result = await client.readContract({
    address: useAllowedSessions
      ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
      : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
    abi: SessionKeyValidatorAbi,
    functionName: 'sessionStatus',
    args: [accountAddress, hash],
  });

  return result;
}

export const getZKSyncSessionClientCreationParams = (
  sessionConfig: SessionConfig,
  accountAddress: Address,
  signerPrivateKey: Hex,
  chain: Chain,
  useAllowedSessions: boolean = true,
  useTestnet: boolean = true,
) => {
  return {
    chain,
    address: accountAddress,
    sessionKey: signerPrivateKey,
    sessionConfig,
    contracts: {
      session: useAllowedSessions
        ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
        : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
    },
    transport: http(),
  };
};

export const isSessionKeyModuleInstalled = async (
  address: Address,
  useAllowedSessions: boolean = true,
  useTestnet: boolean = true,
): Promise<boolean> => {
  const client = createPublicClient({
    chain: useTestnet ? sophonTestnet : sophon,
    transport: http(),
  });

  try {
    const isInstalled = await client.readContract({
      address: useAllowedSessions
        ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
        : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
      abi: SessionKeyValidatorAbi,
      functionName: 'isInitialized',
      args: [address],
    });

    return isInstalled as boolean;
  } catch {
    return false;
  }
};

export const getInstallSessionKeyModuleTxForViem = (
  args: InstallSessionKeyModuleArgs,
  useAllowedSessions: boolean = true,
  useTestnet: boolean = true,
) => {
  const callData = encodeFunctionData({
    abi: SophonAccountAbi,
    functionName: 'addModuleValidator',
    args: [
      useAllowedSessions
        ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
        : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
      '0x',
    ],
  });

  const sendTransactionArgs = {
    from: args.accountAddress,
    to: args.accountAddress,
    paymaster: args.paymaster?.address,
    paymasterInput: args.paymaster?.address
      ? args.paymaster?.paymasterInput ||
        getGeneralPaymasterInput({ innerInput: '0x' })
      : undefined,
    data: callData,
  };

  return sendTransactionArgs;
};

export const getCreateSessionTxForViem = (
  args: Omit<CreateSessionArgs, 'contracts'>,
  accountAddress: Address,
  useAllowedSessions: boolean = true,
  useTestnet: boolean = true,
) => {
  const _args = {
    ...args,
    contracts: {
      session: useAllowedSessions
        ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
        : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
    },
  };

  const callData = encodeFunctionData({
    abi: SessionKeyValidatorAbi,
    functionName: 'createSession',
    args: [_args.sessionConfig],
  });

  const sendTransactionArgs = {
    from: accountAddress,
    to: _args.contracts.session,
    paymaster: args.paymaster?.address,
    paymasterInput: args.paymaster?.address
      ? args.paymaster?.paymasterInput ||
        getGeneralPaymasterInput({ innerInput: '0x' })
      : undefined,
    data: callData,
  };

  return sendTransactionArgs;
};

export const getRevokeSessionTxForViem = (
  args: RevokeSessionArgs,
  accountAddress: Address,
  useAllowedSessions: boolean = true,
  useTestnet: boolean = true,
) => {
  const callData = encodeFunctionData({
    abi: SessionKeyValidatorAbi,
    functionName: 'revokeKey',
    args: [args.sessionHash],
  });

  const revokeKeyArgs = {
    from: accountAddress,
    to: useAllowedSessions
      ? ALLOWED_SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104')
      : SESSION_KEY_MODULE_ADDRESS(useTestnet ? '531050104' : '50104'),
    data: callData,
    paymaster: args.paymaster?.address,
    paymasterInput: args.paymaster?.address
      ? args.paymaster?.paymasterInput ||
        getGeneralPaymasterInput({ innerInput: '0x' })
      : undefined,
  };

  return revokeKeyArgs;
};
