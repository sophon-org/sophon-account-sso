'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSophonAccount } from '@sophon-labs/account-react';
import { ConnectKitButton } from 'connectkit';
import { useCallback, useId } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { type ConnectMode, MODES, useConnectMode } from './connect-mode';

export default function Connectors() {
  const { mode, setMode } = useConnectMode();
  const selectId = useId();

  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const {
    isConnected: sophonConnected,
    account,
    connect: sophonConnect,
    disconnect: sophonDisconnect,
  } = useSophonAccount();

  const isConnected = wagmiConnected || sophonConnected || !!account?.address;
  const currentAddress = (wagmiAddress ?? account?.address ?? '').toLowerCase();

  const { connectAsync, connectors } = useConnect();

  const openWalletconnectModal = useCallback(async () => {
    const wc = connectors.find((c) => c.id === 'walletConnect');
    if (!wc) {
      alert('WalletConnect connector not available.');
      return;
    }
    try {
      await connectAsync({ connector: wc });
    } catch (err) {
      console.error('WalletConnect error:', err);
    }
  }, [connectAsync, connectors]);

  const PrimaryButton = ({
    onClick,
    children = 'Connect Wallet',
    disabled,
  }: {
    onClick?: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      className="h-10 px-3 rounded bg-[#0096F7] text-white disabled:opacity-60 cursor-pointer"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );

  const shorten = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

  const disconnectAll = useCallback(() => {
    try {
      wagmiDisconnect();
    } catch {}
    try {
      sophonDisconnect();
    } catch {}
  }, [wagmiDisconnect, sophonDisconnect]);

  if (isConnected) {
    return (
      <div key={mode} className="flex items-center gap-3">
        <span
          className="flex items-center h-9 rounded border px-3"
          title={currentAddress}
        >
          {shorten(currentAddress)}
        </span>
        <button
          type="button"
          className="flex items-center h-9 px-3 rounded border cursor-pointer bg-purple-400 text-white p-2 hover:bg-purple-500 border-black/40"
          onClick={disconnectAll}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div
      key={mode}
      className="flex flex-col gap-3 p-4 border rounded-lg max-w-lg w-full"
    >
      <div className="flex items-center gap-2">
        <label className="text-sm w-28" htmlFor={selectId}>
          Mode
        </label>
        <select
          id={selectId}
          value={mode}
          onChange={(e) => setMode(e.target.value as ConnectMode)}
          className="border rounded px-2 py-1"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m === 'sophon'
                ? 'Sophon Account'
                : m === 'connectkit'
                  ? 'ConnectKit'
                  : m === 'rainbowkit'
                    ? 'RainbowKit'
                    : 'WalletConnect'}
            </option>
          ))}
        </select>
      </div>

      {mode === 'sophon' && (
        <PrimaryButton
          onClick={async () => {
            try {
              await sophonConnect();
            } catch (e) {
              console.error('Sophon connect failed:', e);
              alert(
                'Could not open Sophon sign-in. Check console for details.',
              );
            }
          }}
        >
          Sign in with Sophon
        </PrimaryButton>
      )}

      {mode === 'connectkit' && (
        <ConnectKitButton.Custom>
          {({ show }) => (
            <PrimaryButton onClick={show}>
              Sign in with ConnectKit
            </PrimaryButton>
          )}
        </ConnectKitButton.Custom>
      )}

      {mode === 'rainbowkit' && (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <PrimaryButton onClick={openConnectModal}>
              Sign in with RainbowKit
            </PrimaryButton>
          )}
        </ConnectButton.Custom>
      )}

      {mode === 'walletconnect' && (
        <PrimaryButton onClick={openWalletconnectModal}>
          Sign in with WalletConnect
        </PrimaryButton>
      )}
    </div>
  );
}
