import { Drawer as VaulDrawer } from 'vaul';
import { IconSophon } from '../icons/icon-sophon';
import { LegalNotice } from '../legal';

export const Drawer = ({
  children,
  showLegalNotice = true,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  showLegalNotice?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/40" />
        <VaulDrawer.Content className="bg-white h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl">
          <VaulDrawer.Title hidden={true}>
            Sophon Authentication Modal
          </VaulDrawer.Title>
          <VaulDrawer.Handle className="mt-4 w-[67px]!" />
          {children}
          <div className="mt-auto flex flex-col gap-2 p-2">
            <div>
              <div className="flex flex-col items-center justify-center w-full">
                {showLegalNotice && <LegalNotice />}
                <div className="flex items-center justify-center gap-2 text-md mt-2">
                  Powered by <IconSophon className="w-12 h-12" />
                </div>
              </div>
            </div>
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
};
