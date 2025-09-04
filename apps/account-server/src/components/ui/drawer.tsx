import { NutIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import React from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { trackDialogInteraction } from '@/lib/analytics';
import { IconBack } from '../icons/icon-back';
import { IconSophon } from '../icons/icon-sophon';
import { LegalNotice } from '../legal';

interface DrawerProps {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnimationEnd?: (open: boolean) => void;
  onBack?: () => void;
  onSettings?: () => void;
  showLegalNotice?: boolean;
  showHeader?: boolean;
  showLogo?: boolean;
  showProfileImage?: boolean;
  title?: string;
  actions?: React.ReactNode;
  drawerType?: string;
}

interface DrawerHeaderProps {
  title?: string;
  showProfileImage?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  drawerType?: string;
}

const DrawerHeader = ({
  title,
  showProfileImage,
  onBack,
  onSettings,
  drawerType = 'drawer',
}: DrawerHeaderProps) => {
  return (
    <div className="relative flex justify-between items-center p-8 gap-2 pb-0">
      <div className="flex items-center gap-2 z-10">
        {showProfileImage && (
          <Image
            src="/images/avatar-example.png"
            alt="Sophon"
            width={28}
            height={28}
          />
        )}
        {onBack && (
          <button
            type="button"
            onClick={() => {
              trackDialogInteraction(drawerType, 'back');
              onBack();
            }}
          >
            <IconBack className="w-5 h-5" />
          </button>
        )}
      </div>
      <h5 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold w-full text-center">
        {title}
      </h5>
      <div className="flex justify-end z-10">
        {onSettings && (
          <button type="button" onClick={onSettings}>
            <NutIcon weight="fill" size={24} className="w-7 h-7" />
          </button>
        )}
      </div>
    </div>
  );
};

interface DrawerFooterProps {
  showLegalNotice?: boolean;
  showLogo?: boolean;
  actions?: React.ReactNode;
}

const DrawerFooter = ({
  showLegalNotice,
  showLogo,
  actions,
}: DrawerFooterProps) => {
  if (!showLegalNotice && !showLogo && !actions) return null;

  return (
    <div className="mt-auto flex flex-col gap-2 p-4">
      <div className="flex flex-col items-center justify-center w-full">
        {actions}
        {showLegalNotice && <LegalNotice />}
        {showLogo && (
          <div className="flex items-center justify-center gap-2 text-md mt-2">
            Powered by <IconSophon className="w-12 h-12" />
          </div>
        )}
      </div>
    </div>
  );
};

export const Drawer = ({
  children,
  open,
  onOpenChange,
  onBack,
  onSettings,
  onAnimationEnd,
  showLegalNotice = true,
  showHeader = true,
  showLogo = true,
  showProfileImage = false,
  title,
  actions,
  drawerType = 'drawer',
}: DrawerProps) => {
  // Track drawer opened/closed
  React.useEffect(() => {
    if (open) {
      trackDialogInteraction(drawerType, 'opened');
    } else {
      trackDialogInteraction(drawerType, 'closed');
    }
  }, [open, drawerType]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      trackDialogInteraction(drawerType, 'closed');
    }
    onOpenChange(isOpen);
  };

  return (
    <VaulDrawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      onAnimationEnd={onAnimationEnd}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/40" />
        <VaulDrawer.Content className="bg-white h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl">
          <VaulDrawer.Title hidden={true}>
            Sophon Authentication Modal
          </VaulDrawer.Title>
          <VaulDrawer.Handle className="mt-4 w-[67px]" />

          {showHeader && (
            <DrawerHeader
              title={title}
              showProfileImage={showProfileImage}
              onBack={onBack}
              onSettings={onSettings}
              drawerType={drawerType}
            />
          )}
          {children}
          <DrawerFooter
            showLegalNotice={showLegalNotice}
            showLogo={showLogo}
            actions={actions}
          />
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
};
