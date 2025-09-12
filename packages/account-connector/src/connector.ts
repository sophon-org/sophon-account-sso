import type { Communicator } from '@sophon-labs/account-communicator';
import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import {
  createSophonEIP1193Provider,
  type EIP1193Provider,
} from '@sophon-labs/account-provider';
import {
  ChainNotConfiguredError,
  type Connector,
  createConnector,
} from '@wagmi/core';
import {
  type Address,
  type Client,
  createWalletClient,
  custom,
  getAddress,
  publicActions,
  SwitchChainError,
  toHex,
  UserRejectedRequestError,
  walletActions,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { eip712WalletActions } from 'viem/zksync';

export const createSophonConnector = (
  network: SophonNetworkType = 'testnet',
  partnerId?: string,
  customAuthServerUrl?: string,
  communicator?: Communicator,
) => {
  const authServerUrl = customAuthServerUrl ?? AccountServerURL[network];
  console.log(
    'createSophonConnector',
    network,
    partnerId,
    authServerUrl,
    communicator,
  );
  let walletProvider: EIP1193Provider | undefined;

  let accountsChanged: Connector['onAccountsChanged'] | undefined;
  let chainChanged: Connector['onChainChanged'] | undefined;
  let disconnect: Connector['onDisconnect'] | undefined;

  const destroyWallet = () => {
    if (walletProvider) {
      if (accountsChanged) {
        walletProvider.removeListener('accountsChanged', accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        walletProvider.removeListener('chainChanged', chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        walletProvider.removeListener('disconnect', disconnect);
        disconnect = undefined;
      }
    }
    walletProvider = undefined;
  };

  return createConnector<EIP1193Provider>((config) => ({
    id:
      network === 'mainnet'
        ? 'xyz.sophon.account'
        : 'xyz.sophon.staging.account',
    name: network === 'mainnet' ? 'Sophon Account' : 'Sophon Account Test',
    icon: 'https://sophon.xyz/favicon.ico',
    type: 'zksync-sso',

    async connect({ chainId } = {}) {
      try {
        const provider = await this.getProvider();
        const accounts = (
          (await provider.request({
            method: 'eth_requestAccounts',
          })) as string[]
        ).map((x) => getAddress(x));

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this);
          provider.on('accountsChanged', accountsChanged);
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this);
          provider.on('chainChanged', chainChanged);
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this);
          provider.on('disconnect', disconnect);
        }

        // Switch to chain if provided
        let walletChainId = await this.getChainId();
        if (chainId && walletChainId !== chainId) {
          const chain = await this.switchChain!({ chainId }).catch((error) => {
            if (error.code === UserRejectedRequestError.code) throw error;
            return { id: walletChainId };
          });
          walletChainId = chain?.id ?? walletChainId;
        }

        return { accounts, chainId: walletChainId };
      } catch (error) {
        console.error(`Error connecting to ${this.name}`, error);
        if (
          /(user closed modal|accounts received is empty|user denied account|request rejected)/i.test(
            (error as Error).message,
          )
        )
          throw new UserRejectedRequestError(error as Error);
        throw error;
      }
    },
    async disconnect() {
      const provider = await this.getProvider();
      provider.disconnect();
      destroyWallet();
    },
    async getAccounts() {
      const provider = await this.getProvider();
      const addresses = (await provider.request({
        method: 'eth_accounts',
      })) as string[];
      return addresses.map((x: string) => getAddress(x));
    },
    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await provider.request({
        method: 'eth_chainId',
      });
      if (!chainId) return config.chains[0].id;
      return Number(chainId);
    },
    async getClient(parameters): Promise<Client> {
      if (!walletProvider) throw new Error('Wallet provider not initialized');
      const supportedChains: number[] = [sophon.id, sophonTestnet.id];
      if (
        parameters?.chainId &&
        !supportedChains.includes(parameters.chainId)
      ) {
        throw new Error(`Chain with id ${parameters.chainId} is not supported`);
      }

      const provider = await this.getProvider();
      const accounts = provider.accounts();
      console.log('accounts', accounts);

      const walletClient = createWalletClient({
        account: accounts[0] as Address,
        chain: network === 'mainnet' ? sophon : sophonTestnet,
        transport: custom(walletProvider),
      })
        .extend(publicActions)
        .extend(walletActions)
        .extend(eip712WalletActions());

      return walletClient;
    },
    async getProvider() {
      if (!walletProvider) {
        walletProvider = createSophonEIP1193Provider(
          network,
          partnerId,
          authServerUrl,
          communicator,
        );
      }
      return walletProvider;
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },
    async switchChain({ chainId }) {
      const chain = config.chains.find((chain) => chain.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      try {
        const provider = await this.getProvider();
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: toHex(chainId) }],
        });
        return chain;
      } catch (error) {
        throw new SwitchChainError(error as Error);
      }
    },
    onAccountsChanged(accounts) {
      if (!accounts.length) return;
      config.emitter.emit('change', {
        accounts: accounts.map((x) => getAddress(x)),
      });
    },
    onChainChanged(chain) {
      config.emitter.emit('change', { chainId: Number(chain) });
    },
    async onDisconnect(error) {
      config.emitter.emit('disconnect');
      // if (error instanceof EthereumProviderError && error.code === 4900) return; // User initiated
      console.error('Account disconnected', error);
    },
  }));
};
