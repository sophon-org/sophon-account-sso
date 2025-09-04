import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  createPublicClient,
  hashMessage,
  hexToNumber,
  http,
  parseAbi,
} from 'viem';
import { sophonTestnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: sophonTestnet,
  transport: http(),
});

const providers = [
  Credentials({
    name: 'Sophon',
    credentials: {
      message: {
        label: 'Message',
        type: 'text',
        placeholder: '0x0',
      },
      signature: {
        label: 'Signature',
        type: 'text',
        placeholder: '0x0',
      },
      address: {
        label: 'Address',
        type: 'text',
        placeholder: '0x0',
      },
    },
    authorize: async (credentials) => {
      const messageHash = hashMessage(credentials.message as string);
      const data = await publicClient.readContract({
        abi: parseAbi([
          'function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)',
        ]),
        functionName: 'isValidSignature',
        args: [messageHash, credentials.signature as `0x${string}`],
        address: credentials.address as `0x${string}`,
      });

      const isValid = hexToNumber(data) > 0;
      if (isValid) {
        return {
          id: credentials.address as `0x${string}`,
        };
      }

      return null;
    },
  }),
];

export const AuthConfig: NextAuthConfig = {
  callbacks: {
    session: async ({ session, token }) => {
      return {
        ...session,
        // you should store your user and fetch it from the db
        user: {
          id: token.sub as `0x${string}`,
        },
      };
    },
  },
  providers,
} as NextAuthConfig;
