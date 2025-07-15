import { createConnector } from "@wagmi/core";
import { Communicator } from "zksync-sso/communicator";
import { zksyncSsoConnector } from "zksync-sso/connector";

export interface SophonAuthResult {
  type: "SOPHON_ACCOUNT_CREATED" | "SOPHON_ACCOUNT_LOGIN";
  data: {
    address: string;
    username?: string;
    passkeyPublicKey?: string;
    mode: "create" | "login";
    timestamp: string;
  };
}

export interface SophonAuthOptions {
  authUrl?: string;
  popupWidth?: number;
  popupHeight?: number;
}

export function connectSophon(
  options: SophonAuthOptions = {}
): Promise<SophonAuthResult> {
  const {
    authUrl = "http://localhost:3000",
    popupWidth = 400,
    popupHeight = 600,
  } = options;

  return new Promise((resolve, reject) => {
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    const popup = window.open(
      authUrl,
      "sophon-auth",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=no,resizable=no,status=no,toolbar=no,menubar=no,location=no,titlebar=no`
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (
        !event.origin.includes("localhost") &&
        !event.origin.includes("sophon")
      ) {
        return;
      }

      if (
        event.data.type === "SOPHON_ACCOUNT_CREATED" ||
        event.data.type === "SOPHON_ACCOUNT_LOGIN"
      ) {
        window.removeEventListener("message", messageHandler);
        clearInterval(checkClosed);
        resolve(event.data);
      }
    };

    window.addEventListener("message", messageHandler);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
        reject(new Error("Authentication cancelled"));
      }
    }, 1000);
  });
}

export const sophonSsoConnector: any = (options?: {
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

export default connectSophon;
