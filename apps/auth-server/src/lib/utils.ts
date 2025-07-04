import {
  createPublicClient,
  http,
  toHex,
  keccak256,
  encodePacked,
  toBytes,
  concat,
  hashTypedData,
  Address,
} from "viem";

import { sophonTestnet } from "viem/chains";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";

const SALT_PREFIX = "SophonLabs";

// TODO: change this implementation to a indexed one
export const isAccountDeployed = async (connectedAddress: string) => {
  const existingAccountAddress = await checkAccountOwnership(
    connectedAddress,
    process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS as `0x${string}`
  );
  return (
    existingAccountAddress &&
    existingAccountAddress !== "0x0000000000000000000000000000000000000000"
  );
};

export const getSmartAccountUniqueId = (ownerAddress: Address) => {
  const salt = `0x${Buffer.from(toBytes(SALT_PREFIX, { size: 32 })).toString(
    "hex"
  )}` as `0x${string}`;

  const uniqueIds: `0x${string}`[] = [];
  uniqueIds.push(toHex(salt));
  uniqueIds.push(ownerAddress as `0x${string}`);
  const transformedUniqueId = keccak256(toHex(concat(uniqueIds)));

  return transformedUniqueId;
};

export const getSmartAccountAddress = (
  ownerAddress: Address,
  deployerAddress?: Address
) => {
  const knownUniqueId = getSmartAccountUniqueId(ownerAddress);

  return keccak256(
    encodePacked(
      ["bytes32", "address"],
      [
        knownUniqueId as `0x${string}`,
        (deployerAddress ?? ownerAddress) as `0x${string}`,
      ]
    )
  );
};

export const checkAccountOwnership = async (
  connectedAddress: string,
  deployerAddress: Address
) => {
  const contracts = CHAIN_CONTRACTS[DEFAULT_CHAIN_ID];
  const publicClient = createPublicClient({
    chain: sophonTestnet,
    transport: http("https://rpc.testnet.sophon.xyz"),
  });

  const salt = `0x${Buffer.from(toBytes(SALT_PREFIX, { size: 32 })).toString(
    "hex"
  )}` as `0x${string}`;

  const uniqueIds: `0x${string}`[] = [];
  uniqueIds.push(toHex(salt));
  uniqueIds.push(connectedAddress as `0x${string}`);
  const transformedUniqueId = keccak256(toHex(concat(uniqueIds)));

  const knownUniqueId = transformedUniqueId;

  try {
    const uniqueAccountId = keccak256(
      encodePacked(
        ["bytes32", "address"],
        [knownUniqueId as `0x${string}`, deployerAddress as `0x${string}`]
      )
    );
    console.log(
      "calaulating",
      uniqueAccountId,
      "connected address",
      connectedAddress,
      "for deployer",
      deployerAddress
    );

    const existingAccountAddress = await publicClient.readContract({
      address: contracts.accountFactory as `0x${string}`,
      abi: [
        {
          name: "accountMappings",
          inputs: [{ name: "accountId", type: "bytes32" }],
          outputs: [{ name: "deployedAccount", type: "address" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "accountMappings",
      args: [uniqueAccountId],
    });

    console.log("Existing account:", existingAccountAddress);

    return existingAccountAddress;
  } catch (checkError) {
    console.log("Account check failed:", checkError);
  }
};

export const verifyEIP1271Signature = async ({
  accountAddress,
  signature,
  domain,
  types,
  primaryType,
  message,
}: {
  accountAddress: string;
  signature: string;
  domain: {
    name?: string;
    version?: string;
    chainId?: number | bigint;
    verifyingContract?: `0x${string}`;
    salt?: `0x${string}`;
  };
  types: Record<string, readonly unknown[]>;
  primaryType: string;
  message: Record<string, unknown>;
}) => {
  try {
    const publicClient = createPublicClient({
      chain: sophonTestnet,
      transport: http("https://rpc.testnet.sophon.xyz"),
    });

    const messageHash = hashTypedData({
      domain,
      types,
      primaryType,
      message,
    });

    // Call isValidSignature on the SsoAccount contract
    const result = await publicClient.readContract({
      address: accountAddress as `0x${string}`,
      abi: [
        {
          name: "isValidSignature",
          inputs: [
            { name: "hash", type: "bytes32" },
            { name: "signature", type: "bytes" },
          ],
          outputs: [{ name: "", type: "bytes4" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "isValidSignature",
      args: [messageHash, signature as `0x${string}`],
    });

    // EIP-1271 magic value for valid signature
    const EIP1271_MAGIC_VALUE = "0x1626ba7e";
    const isValid = result === EIP1271_MAGIC_VALUE;
    console.log("🔍 EIP-1271 result:", result);
    console.log("🔍 Is valid signature:", isValid);

    return isValid;
  } catch (error) {
    console.error("❌ EIP-1271 verification failed:", error);
    return false;
  }
};
