import { http, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { AccountType, type PasskeySigner } from '@/types/smart-account';
import { useAccountContext } from './useAccountContext';

export const useCreateSession = () => {
  const { account } = useAccountContext();

  const createSession = async () => {
    // TODO: Integrate this into button handlers
    console.log('Session creation requested for:', account?.address);

    try {
      // Generate session key
      const sessionKey = generatePrivateKey();
      const sessionSigner = privateKeyToAccount(sessionKey);

      // ✅ Get passkey data from account store (now stored as hex, retrieved as bytes)
      if (
        !account ||
        account.signer?.accountType !== AccountType.PASSKEY ||
        !account.address
      ) {
        throw new Error(
          'No passkey data available - account may not be fully created yet',
        );
      }

      const accountAddress = account.address;

      const client = createZksyncPasskeyClient({
        address: accountAddress,
        credentialPublicKey: (account.signer as PasskeySigner).passkey,
        userName: (account.signer as PasskeySigner).username,
        userDisplayName: (account.signer as PasskeySigner).userDisplayName,
        contracts: CONTRACTS,
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
      });

      const sessionConfig = {
        signer: sessionSigner.address,
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 24 hours
        feeLimit: {
          limitType: 0,
          limit: parseEther('0.01'),
          period: BigInt(0),
        },
        callPolicies: [], // Empty - allow message signing
        transferPolicies: [], // Empty - allow message signing
      };

      console.log('📄 Session config:', sessionConfig);
      console.log('🔐 Account address:', accountAddress);
      console.log('🗝️ Session signer:', sessionSigner.address);

      // Generate a unique session signer each time to avoid conflicts
      const timestamp = Date.now();
      console.log('⏰ Session timestamp:', timestamp);

      const sessionPromise = client.createSession({
        sessionConfig,
      });

      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error('Session creation timed out after 30 seconds')),
          30000,
        );
      });

      const result = (await Promise.race([
        sessionPromise,
        timeoutPromise,
      ])) as unknown;

      console.log(
        '✅ Session created successfully:',
        (result as { transactionReceipt?: { transactionHash?: string } })
          ?.transactionReceipt?.transactionHash,
      );

      return {
        sessionKey,
        sessionConfig: {
          signer: sessionConfig.signer,
          expiresAt: sessionConfig.expiresAt.toString(),
          feeLimit: {
            limitType: sessionConfig.feeLimit.limitType,
            limit: sessionConfig.feeLimit.limit.toString(),
            period: sessionConfig.feeLimit.period.toString(),
          },
          callPolicies: [],
          transferPolicies: [],
        },
      };
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      console.log('🔄 Falling back to regular connection (no session)');
      return null; // Fallback to regular connection
    }
  };

  return createSession;
};
