import {
  type Address,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAbiItem,
  getAddress,
  type Hex,
  http,
  keccak256,
} from 'viem';
import { type Chain, sophonTestnet } from 'viem/chains';
import { getGeneralPaymasterInput } from 'viem/zksync';
import { SessionKeyValidatorAbi } from './abis/SessionKeyValidatorAbi';
import { SophonAccountAbi } from './abis/SophonAccountAbi';
import { CHAIN_CONTRACTS, type ChainId, SophonChains } from './constants';
import {
  type CallPolicy,
  type CreateSessionArgs,
  type InstallSessionKeyModuleArgs,
  type Limit,
  LimitType,
  type RevokeSessionArgs,
  type SessionConfig,
  type SessionState,
  type SessionStatus,
  type TransferPolicy,
} from './types';

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
  // biome-ignore lint/suspicious/noExplicitAny: improve this
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

export interface SessionParams {
  accountAddress: Address;
  sessionConfig: SessionConfig;
  chainId: ChainId;
}

export async function getSessionState({
  accountAddress,
  sessionConfig,
  chainId = sophonTestnet.id,
}: SessionParams): Promise<SessionState> {
  const client = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(),
  });

  const result = await client.readContract({
    address: CHAIN_CONTRACTS[chainId].session,
    abi: SessionKeyValidatorAbi,
    functionName: 'sessionState',
    args: [accountAddress, sessionConfig],
  });

  return result as SessionState;
}

export async function getSessionStatus({
  accountAddress,
  sessionConfig,
  chainId,
}: {
  accountAddress: Address;
  sessionConfig: SessionConfig;
  chainId: ChainId;
}): Promise<SessionStatus>;

export async function getSessionStatus({
  accountAddress,
  sessionHash,
  chainId,
}: {
  accountAddress: Address;
  sessionHash: `0x${string}`;
  chainId: ChainId;
}): Promise<SessionStatus>;

export async function getSessionStatus({
  accountAddress,
  sessionConfig,
  sessionHash,
  chainId = sophonTestnet.id,
}: {
  accountAddress: Address;
  sessionConfig?: SessionConfig;
  sessionHash?: `0x${string}`;
  chainId: ChainId;
}): Promise<SessionStatus> {
  const client = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(),
  });

  const hash = sessionHash ?? getSessionHash(sessionConfig!);

  // Call the getState function on the session key module
  const result = await client.readContract({
    address: CHAIN_CONTRACTS[chainId].session,
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
  chainId = sophonTestnet.id,
) => {
  return {
    chain,
    address: accountAddress,
    sessionKey: signerPrivateKey,
    sessionConfig,
    contracts: {
      session: CHAIN_CONTRACTS[chainId].session,
    },
    transport: http(),
  };
};

export const isSessionKeyModuleInstalled = async (
  address: Address,
  chainId = sophonTestnet.id,
): Promise<boolean> => {
  const client = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(),
  });

  try {
    const isInstalled = await client.readContract({
      address: CHAIN_CONTRACTS[chainId].session,
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
  chainId = sophonTestnet.id,
) => {
  const callData = encodeFunctionData({
    abi: SophonAccountAbi,
    functionName: 'addModuleValidator',
    args: [CHAIN_CONTRACTS[chainId].session, '0x'],
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
  chainId = sophonTestnet.id,
) => {
  const _args = {
    ...args,
    contracts: {
      session: CHAIN_CONTRACTS[chainId].session,
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
  chainId = sophonTestnet.id,
) => {
  const callData = encodeFunctionData({
    abi: SessionKeyValidatorAbi,
    functionName: 'revokeKey',
    args: [args.sessionHash],
  });

  const revokeKeyArgs = {
    from: accountAddress,
    to: CHAIN_CONTRACTS[chainId].session,
    data: callData,
    paymaster: args.paymaster?.address,
    paymasterInput: args.paymaster?.address
      ? args.paymaster?.paymasterInput ||
        getGeneralPaymasterInput({ innerInput: '0x' })
      : undefined,
  };

  return revokeKeyArgs;
};

export const getPeriodIdsForTransaction = (args: {
  sessionConfig: SessionConfig;
  target: Address;
  selector?: Hex;
  timestamp?: bigint;
}) => {
  const timestamp = args.timestamp || BigInt(Math.floor(Date.now() / 1000));
  const target = getAddress(args.target.toLowerCase());

  const getId = (limit: Limit): bigint => {
    if (limit.limitType === LimitType.Allowance) {
      return timestamp / limit.period;
    }
    return BigInt(0);
  };

  const findTransferPolicy = () => {
    return args.sessionConfig.transferPolicies.find(
      (policy) => policy.target === target,
    );
  };
  const findCallPolicy = () => {
    return args.sessionConfig.callPolicies.find(
      (policy) => policy.target === target && policy.selector === args.selector,
    );
  };

  const isContractCall = !!args.selector;
  const policy: TransferPolicy | CallPolicy | undefined = isContractCall
    ? findCallPolicy()
    : findTransferPolicy();
  if (!policy) throw new Error('Transaction does not fit any policy');

  const periodIds = [
    getId(args.sessionConfig.feeLimit),
    getId(policy.valueLimit),
    ...(isContractCall
      ? (policy as CallPolicy).constraints.map((constraint) =>
          getId(constraint.limit),
        )
      : []),
  ];
  return periodIds;
};
