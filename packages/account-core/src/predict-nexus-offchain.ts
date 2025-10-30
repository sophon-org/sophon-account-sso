import {
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  pad,
  parseAbiParameters,
  toHex,
  getCreate2Address,
  isAddress,
  type Hex,
  zeroAddress,
} from 'viem';
import { CHAIN_CONTRACTS, type ChainId } from  './constants';


/** INexus.initializeAccount(bytes) */
const INexusAbi = [
  {
    type: 'function',
    name: 'initializeAccount',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'initData', type: 'bytes' }],
    outputs: [],
  },
] as const;

/** NexusBootstrap.initNexusWithDefaultValidatorAndOtherModulesNoRegistry
 *  Signature that matches your working vector:
 *   - first arg: bytes defaultValidatorInitData  (raw 20-byte owner, NOT abi.encode)
 *   - hook.data: 32-byte zero
 *   - preValidationHooks.hookType: uint256
 *   - order: defaultValidatorInitData, validators, executors, hook, fallbacks, preValidationHooks
 */
const NexusBootstrapAbi = [
  {
    type: 'function',
    name: 'initNexusWithDefaultValidatorAndOtherModulesNoRegistry',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'defaultValidatorInitData',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: 'validators',
        type: 'tuple[]',
        internalType: 'struct BootstrapConfig[]',
        components: [
          { name: 'module', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      {
        name: 'executors',
        type: 'tuple[]',
        internalType: 'struct BootstrapConfig[]',
        components: [
          { name: 'module', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      {
        name: 'hook',
        type: 'tuple',
        internalType: 'struct BootstrapConfig',
        components: [
          { name: 'module', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      {
        name: 'fallbacks',
        type: 'tuple[]',
        internalType: 'struct BootstrapConfig[]',
        components: [
          { name: 'module', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      {
        name: 'preValidationHooks',
        type: 'tuple[]',
        internalType: 'struct BootstrapPreValidationHookConfig[]',
        components: [
          { name: 'hookType', type: 'uint256', internalType: 'uint256' },
          { name: 'module', type: 'address', internalType: 'address' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
] as const;

export type PredictNexusOffchainParams = {
  factory: `0x${string}`;
  implementation: `0x${string}`;
  bootstrap: `0x${string}`;
  /** raw type(NexusProxy).creationCode */
  proxyCreationCode: Hex;
  owner: `0x${string}`;
  index?: bigint | number | string; // defaults to 0
  /** keep logs (default true, matches your current scripts) */
  log?: boolean;
};

export type PredictNexusOffchainResult = {
  address: `0x${string}`;
  salt: Hex;
  initCode: Hex;
  initCodeHash: `0x${string}`;
};

export type PredictNexusOffchainByChainParams = {
  chainId: ChainId;
  owner: `0x${string}`;
  index?: bigint | number | string;
  proxyCreationCode?: Hex;
  log?: boolean;
};

export function predictNexusOffchainByChain(
  params: PredictNexusOffchainByChainParams,
) {
  const { chainId, owner, index = 0, proxyCreationCode, log = true } = params;

  const cfg = CHAIN_CONTRACTS[chainId];
  if (!cfg) throw new Error(`Unsupported chainId: ${chainId}`);

  const {
    accountFactory,
    accountImplementation,
    bootstrap,
    accountCodeStorage,
  } = cfg;

  // quick sanity on required addresses
  for (const [label, addr] of Object.entries({
    accountFactory,
    accountImplementation,
    bootstrap,
  })) {
    if (!isAddress(addr) || addr === zeroAddress)
      throw new Error(`Missing/zero ${label} for chainId ${chainId}`);
  }
  const looksLikeAddress = /^0x[0-9a-fA-F]{40}$/.test(accountCodeStorage);
  const creationCode: Hex = looksLikeAddress
    ? (() => {
        if (!proxyCreationCode)
          throw new Error(
            `CHAIN_CONTRACTS[${chainId}].accountCodeStorage is an address (${accountCodeStorage}). ` +
              `Provide 'proxyCreationCode' explicitly for off-chain prediction.`,
          );
        return proxyCreationCode;
      })()
    : (accountCodeStorage as Hex);


  return predictNexusOffchain({
    factory: accountFactory as `0x${string}`,
    implementation: accountImplementation as `0x${string}`,
    bootstrap: bootstrap as `0x${string}`,
    proxyCreationCode: creationCode,
    owner,
    index,
    log,
  });
}

/** Predict the counterfactual Nexus account address fully off-chain (no deps on abstractjs). */
export function predictNexusOffchain(
  params: PredictNexusOffchainParams,
): PredictNexusOffchainResult {
  const {
    factory,
    implementation,
    bootstrap,
    proxyCreationCode,
    owner,
    index = 0,
    log = true,
  } = params;

  for (const a of [factory, implementation, bootstrap, owner]) {
    if (!isAddress(a)) throw new Error(`Bad address in params: ${a}`);
  }
  if (!proxyCreationCode.startsWith('0x')) {
    throw new Error('proxyCreationCode must be 0x-prefixed hex');
  }

  const idx = BigInt(index);
  const salt = pad(toHex(idx), { size: 32 }) as Hex;

  // bytes defaultValidatorInitData = raw 20-byte owner (NOT abi.encode(address))
  const defaultValidatorInitData = owner as Hex;

  const emptyMods: Array<{ module: `0x${string}`; data: `0x${string}` }> = [];
  const emptyHooks: Array<{
    hookType: bigint;
    module: `0x${string}`;
    data: `0x${string}`;
  }> = [];
  const hookCfg = {
    module: '0x0000000000000000000000000000000000000000' as const,
    // must be 32-byte zero for parity with your on-chain result
    data: '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
  };

  const bootstrapCall = encodeFunctionData({
    abi: NexusBootstrapAbi,
    functionName: 'initNexusWithDefaultValidatorAndOtherModulesNoRegistry',
    args: [
      defaultValidatorInitData,
      emptyMods,
      emptyMods,
      hookCfg,
      emptyMods,
      emptyHooks,
    ],
  });

  const initData = encodeAbiParameters(parseAbiParameters('address, bytes'), [
    bootstrap,
    bootstrapCall,
  ]);

  const initializerCalldata = encodeFunctionData({
    abi: INexusAbi,
    functionName: 'initializeAccount',
    args: [initData],
  });

  // constructor (address implementation, bytes data)
  const ctorArgs = encodeAbiParameters(parseAbiParameters('address, bytes'), [
    implementation,
    initializerCalldata,
  ]);

  // Full init code = creationCode ++ constructorArgs
  const initCode = concat([proxyCreationCode, ctorArgs]) as Hex;
  const initCodeHash = keccak256(initCode);
  const address = getCreate2Address({
    from: factory,
    salt,
    bytecodeHash: initCodeHash,
  }) as `0x${string}`;

  if (log) {
    console.log('Factory:         ', factory);
    console.log('Implementation:  ', implementation);
    console.log('Bootstrap:       ', bootstrap);
    console.log('Owner:           ', owner);
    console.log('Index:           ', idx.toString());
    console.log('Salt:            ', salt);
    console.log('initCode keccak: ', initCodeHash);
    console.log('Predicted:       ', address);
  }

  return { address, salt, initCode, initCodeHash };
}

/* Example:
import { predictNexusOffchain } from "./predict-nexus-offchain";
//  for NEXUS_PROXY_CREATION_CODE look in test
const out = predictNexusOffchain({
  factory: "0x0000006648ED9B2B842552BE63Af870bC74af837",
  implementation: "0x00000000383e8cBe298514674Ea60Ee1d1de50ac",
  bootstrap: "0x0000003eDf18913c01cBc482C978bBD3D6E8ffA3",
  proxyCreationCode: process.env.NEXUS_PROXY_CREATION_CODE as `0x${string}`,
  owner: "0xD0bAfa560e2EaC2e9Da80FBc3368bfcFdf3022B8",
  index: 0,
});
*/
