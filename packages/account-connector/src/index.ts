import type { Communicator } from "zksync-sso/communicator";
import { zksyncSsoConnector } from "zksync-sso/connector";

// biome-ignore lint/suspicious/noExplicitAny: TODO remove later
export const sophonSsoConnector: any = (options?: {
  // biome-ignore lint/suspicious/noExplicitAny: TODO remove later
  session?: any; // TODO: type this properly later
  paymaster?: `0x${string}`;
  communicator?: Communicator;
}) => {
  const connector = zksyncSsoConnector({
    authServerUrl: "http://localhost:3000", // auth server
    metadata: {
      name: "Sophon SSO",
      icon: "/sophon-icon.png",
    },
    paymasterHandler: async () => ({
      paymaster:
        options?.paymaster || "0x98546B226dbbA8230cf620635a1e4ab01F6A99B2",
      paymasterInput: "0x",
    }),
    // Remove session config to test auth-server mode
    // session: options?.session || {
    //   expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 24 hours
    //   feeLimit: {
    //     limitType: "Lifetime" as const, // Need to check proper enum value
    //     limit: parseEther("0.01"), // 0.01 ETH for gas fees
    //   },
    //   callPolicies: [], // Contract calls allowed
    //   transferPolicies: [], // Token transfers allowed
    //   // Message signing is implicitly allowed in sessions
    // },
    communicator: options?.communicator,
  });

  return connector;
};
