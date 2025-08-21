import React from 'react';
import { sendMessage } from '@/events';
import { trackDialogInteraction } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { IconBack } from '../icons/icon-back';
import { IconClose } from '../icons/icon-close';
import { IconSettings } from '../icons/icon-settings';
import { IconSophon } from '../icons/icon-sophon';
import { LegalNotice } from '../legal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const DialogHeader = ({
  title,
  onBack,
  onClose,
  showSettings,
  dialogType = 'dialog',
}: {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  showSettings?: boolean;
  dialogType?: string;
}) => {
  const handleDisconnect = () => {
    sendMessage('smart-contract.logout', null);
  };
  return (
    <div className="flex justify-between items-center py-2 px-6 min-h-16">
      {!!onBack && (
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => {
            trackDialogInteraction(dialogType, 'back');
            onBack();
          }}
        >
          <IconBack className="m-w-6 m-h-6" />
        </button>
      )}
      <h2 className="text-2xl font-bold flex-grow text-center">{title}</h2>
      {!!onClose && (
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => {
            trackDialogInteraction(dialogType, 'closed');
            onClose();
          }}
        >
          <IconClose className="m-w-6 m-h-6" />
        </button>
      )}
      {!!showSettings && (
        <DropdownMenu>
          <DropdownMenuTrigger className=" cursor-pointer">
            <IconSettings className="m-w-6 m-h-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-5">
            <DropdownMenuItem
              onClick={() => {
                window.parent.open('https://app.sophon.xyz/', '_blank');
              }}
            >
              Manage account at Sophon home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDisconnect}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export const DialogFooter = ({
  showLegalNotice,
  actions,
}: {
  showLegalNotice: boolean;
  actions: React.ReactNode;
}) => {
  return (
    <div className="mt-6">
      <div className="flex flex-col items-center justify-center w-full px-6 pb-6">
        {showLegalNotice && <LegalNotice />}
        {actions}
        <div className="flex items-center justify-center gap-2 text-md mt-2">
          Powered by <IconSophon className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
};

export interface DialogProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
  onClose?: () => void;
  showLegalNotice?: boolean;
  actions?: React.ReactNode;
  showSettings?: boolean;
  dialogType?: string;
}

export function Dialog({
  title,
  children,
  className,
  onBack,
  onClose,
  showLegalNotice = true,
  actions,
  showSettings = false,
  dialogType = 'dialog',
}: DialogProps) {
  // Track dialog opened
  React.useEffect(() => {
    trackDialogInteraction(dialogType, 'opened');
  }, [dialogType]);

  return (
    <div
      className={cn('bg-white h-full w-full overflow-auto', className)}
      style={{
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 75%), url(/images/skybg.webp) lightgray -46.312px 0px / 395.062% 100% no-repeat',
      }}
    >
      <div
        className={cn('mx-auto h-full relative max-w-[360px] flex flex-col')}
      >
        <DialogHeader
          title={title}
          onBack={onBack}
          onClose={onClose}
          showSettings={showSettings}
          dialogType={dialogType}
        />
        <div className="flex-1">{children}</div>
        <DialogFooter showLegalNotice={showLegalNotice} actions={actions} />
      </div>
    </div>
  );
}
