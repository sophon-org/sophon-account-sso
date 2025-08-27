import { XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { AddressLink } from '@/components/transaction-views';
import { MainStateMachineContext } from '@/context/state-machine-context';

type DrawerContentType =
  | 'raw-transaction'
  | 'raw-signing'
  | 'fee-details'
  | 'error'
  | null;

interface DrawerState {
  isOpen: boolean;
  contentType: DrawerContentType;
  data?: string | object;
}

export const useRequestDrawer = () => {
  const state = MainStateMachineContext.useSelector((state) => state);

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    contentType: null,
  });

  const openDrawer = (type: DrawerContentType, data?: string | object) => {
    setDrawerState({ isOpen: true, contentType: type, data });
  };

  const closeDrawer = () => {
    setDrawerState({ isOpen: false, contentType: null });
  };

  const renderDrawerContent = () => {
    const transactionRequest = state.context.requests?.transaction;
    const typedDataSigning = state.context.requests?.typedDataSigning;
    const messageSigning = state.context.requests?.messageSigning;

    switch (drawerState.contentType) {
      case 'raw-transaction':
        return (
          <div className="p-4">
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(transactionRequest, null, 2)}
            </pre>
          </div>
        );
      case 'raw-signing':
        return (
          <div className="p-4">
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(typedDataSigning || messageSigning, null, 2)}
            </pre>
          </div>
        );
      case 'fee-details': {
        const data = drawerState.data as {
          fee?: { SOPH?: string; USD?: string };
          paymaster?: string;
        };

        const isSponsored = data?.paymaster && data.paymaster !== '0x';

        return (
          <div className="p-4">
            <div className="space-y-3">
              {isSponsored ? (
                <div className=" rounded-lg p-3">
                  <div className="text-sm break-all">
                    <span className="mr-1">Sponsored by Paymaster at:</span>
                    <AddressLink address={data.paymaster || ''} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Network Fee:</span>
                    <span>{data?.fee?.SOPH || 'N/A'} SOPH</span>
                  </div>
                  {data?.fee?.USD && (
                    <div className="flex justify-between">
                      <span>Fee (USD):</span>
                      <span>${data.fee.USD}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      }
      case 'error':
        return (
          <div className="p-4">
            <div className="text-sm text-red-600">
              {typeof drawerState.data === 'string'
                ? drawerState.data
                : typeof drawerState.data === 'object'
                  ? JSON.stringify(drawerState.data, null, 2)
                  : 'An error occurred'}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const DrawerComponent = () => {
    const title =
      drawerState.contentType === 'raw-transaction'
        ? 'Raw Transaction'
        : drawerState.contentType === 'raw-signing'
          ? 'Raw Signing Data'
          : drawerState.contentType === 'fee-details'
            ? 'Fee Details'
            : drawerState.contentType === 'error'
              ? 'Error Details'
              : '';

    return (
      <VaulDrawer.Root open={drawerState.isOpen} onOpenChange={closeDrawer}>
        <VaulDrawer.Portal>
          <VaulDrawer.Overlay className="fixed inset-0 bg-black/40" />
          <VaulDrawer.Content className="bg-white h-fit max-h-[80vh] fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl overflow-hidden">
            <VaulDrawer.Handle className="mt-4 w-[67px]" />
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <VaulDrawer.Title className="text-xl font-semibold text-center flex-1">
                {title}
              </VaulDrawer.Title>
              <VaulDrawer.Close asChild>
                <XIcon size={16} className="text-black cursor-pointer" />
              </VaulDrawer.Close>
            </div>

            <div className="overflow-auto max-h-[60vh]">
              {renderDrawerContent()}
            </div>
          </VaulDrawer.Content>
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    );
  };

  return {
    openDrawer,
    closeDrawer,
    DrawerComponent,
  };
};
