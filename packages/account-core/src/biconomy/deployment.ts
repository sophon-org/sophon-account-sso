import {
  getMEEVersion,
  MEEVersion,
  NexusBootstrapAbi,
} from '@biconomy/abstractjs';
import {
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  type Hex,
  http,
  pad,
  parseAbiParameters,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NexusFactoryPassthroughAbi } from '../abis';
import { CHAIN_CONTRACTS, type ChainId, SophonChains } from '../constants';

type BootstrapConfig = { module: `0x${string}`; data: `0x${string}` };
type BootstrapPreValidationHook = {
  hookType: bigint;
  module: `0x${string}`;
  data: `0x${string}`;
};

interface ComputeAddressResult {
  predictedAddress: Address;
  initData: Hex;
  saltHex: Hex;
}

interface DeploymentResult {
  accountAddress: Address;
  alreadyDeployed: boolean;
  transactionHash: Hex | null;
}

/**
 * Computes the predicted Biconomy Nexus account address for an owner
 * @param chain - The chain to deploy on
 * @param ownerAddress - The owner's EOA address
 * @returns Predicted account address, init data, and salt
 */
export const computeBiconomyAccountAddress = async (
  chainId: ChainId,
  ownerAddress: Address,
): Promise<ComputeAddressResult> => {
  const publicClient = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(),
  });

  const meeConfig = getMEEVersion(MEEVersion.V2_1_0);
  const factoryAddress = CHAIN_CONTRACTS[chainId].accountFactory;
  const bootstrapAddress = meeConfig.bootStrapAddress;
  const accountIndex = BigInt(0);
  const saltHex = pad(toHex(accountIndex), { size: 32 }) as Hex;

  // Empty module arrays for basic account
  const emptyModules: BootstrapConfig[] = [];
  const emptyPrevalidationHooks: BootstrapPreValidationHook[] = [];
  const hookConfig: BootstrapConfig = { module: zeroAddress, data: zeroHash };

  // Encode the bootstrap initialization call
  const bootstrapCall = encodeFunctionData({
    abi: NexusBootstrapAbi,
    functionName: 'initNexusWithDefaultValidatorAndOtherModulesNoRegistry',
    args: [
      ownerAddress,
      emptyModules,
      emptyModules,
      hookConfig,
      emptyModules,
      emptyPrevalidationHooks,
    ],
  });

  // Encode the init data (bootstrap address + bootstrap call)
  const initData = encodeAbiParameters(parseAbiParameters('address, bytes'), [
    bootstrapAddress,
    bootstrapCall,
  ]) as Hex;

  // Compute the predicted account address
  const predictedAddress = (await publicClient.readContract({
    address: factoryAddress,
    abi: NexusFactoryPassthroughAbi,
    functionName: 'computeAccountAddress',
    args: [initData, saltHex],
  })) as Address;

  return {
    predictedAddress,
    initData,
    saltHex,
  };
};

/**
 * Checks if a Biconomy account is deployed at the predicted address
 * @param chain - The chain to check on
 * @param accountAddress - The account address to check
 * @returns True if deployed, false otherwise
 */
export const isBiconomyAccountDeployed = async (
  chain: Chain,
  accountAddress: Address,
): Promise<boolean> => {
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const code = await publicClient.getCode({ address: accountAddress });
  return code !== undefined && code !== '0x';
};

/**
 * Deploys a Biconomy Nexus account for an owner
 * @param chain - The chain to deploy on
 * @param ownerAddress - The owner's EOA address
 * @param deployerPrivateKey - The private key of the deployer account
 * @param sophonName - Optional Sophon name (pass empty string to skip)
 * @returns Deployment result with account address and transaction hash
 */
export const deployBiconomyAccount = async (
  chainId: ChainId,
  ownerAddress: Address,
  deployerPrivateKey: Hex,
  sophonName: string = '',
): Promise<DeploymentResult> => {
  // Compute the predicted address
  const { predictedAddress, initData, saltHex } =
    await computeBiconomyAccountAddress(chainId, ownerAddress);

  // Check if already deployed
  const alreadyDeployed = await isBiconomyAccountDeployed(
    SophonChains[chainId],
    predictedAddress,
  );

  if (alreadyDeployed) {
    return {
      accountAddress: predictedAddress,
      alreadyDeployed: true,
      transactionHash: null,
    };
  }

  // Create deployer account
  const deployerAccount = privateKeyToAccount(deployerPrivateKey);

  // Create public client to check balance
  const publicClient = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(),
  });

  const deployerBalance = await publicClient.getBalance({
    address: deployerAccount.address,
  });

  if (deployerBalance === BigInt(0)) {
    throw new Error(
      `Deployer account ${deployerAccount.address} has no balance for gas`,
    );
  }

  // Create wallet client for deployment
  const deployerClient = createWalletClient({
    account: deployerAccount,
    chain: SophonChains[chainId],
    transport: http(),
  });

  const factoryAddress = CHAIN_CONTRACTS[chainId].accountFactory;

  // Deploy the account
  const txHash = await deployerClient.writeContract({
    address: factoryAddress,
    abi: NexusFactoryPassthroughAbi,
    functionName: 'createAccountWithName',
    args: [initData, saltHex, sophonName],
    value: BigInt(0),
  });

  // Wait for transaction confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    accountAddress: predictedAddress,
    alreadyDeployed: false,
    transactionHash: txHash,
  };
};

/**
 * Gets the Biconomy account address for an owner if deployed
 * @param chain - The chain to check on
 * @param ownerAddress - The owner's EOA address
 * @returns Array with account address if deployed, empty array otherwise
 */
export const getBiconomyAccountsByOwner = async (
  chainId: ChainId,
  ownerAddress: Address,
): Promise<Address[]> => {
  const { predictedAddress } = await computeBiconomyAccountAddress(
    chainId,
    ownerAddress,
  );

  const isDeployed = await isBiconomyAccountDeployed(
    SophonChains[chainId],
    predictedAddress,
  );

  return isDeployed ? [predictedAddress] : [];
};
