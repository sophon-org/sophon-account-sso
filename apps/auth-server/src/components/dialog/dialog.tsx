import { cn } from "@/lib/cn";
import { IconClose } from "../icons/icon-close";
import { IconBack } from "../icons/icon-back";
import { IconSophon } from "../icons/icon-sophon";
import { LegalNotice } from "../legal";
import { IconSettings } from "../icons/icon-settings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const DialogHeader = ({
  title,
  onBack,
  onClose,
  onSettings,
}: {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  onSettings?: () => void;
}) => {
  return (
    <div className="flex justify-between items-center p-2 min-h-16">
      {!!onBack && (
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={onBack}
        >
          <IconBack className="m-w-6 m-h-6" />
        </button>
      )}
      <h2 className="text-2xl font-bold flex-grow text-center">{title}</h2>
      {!!onClose && (
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={onClose}
        >
          <IconClose className="m-w-6 m-h-6" />
        </button>
      )}
      {!!onSettings && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={onSettings}
            >
              <IconSettings className="m-w-6 m-h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage account at Sophon home</p>
          </TooltipContent>
        </Tooltip>
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
    <div className="flex justify-center items-center">
      <div className="flex flex-col items-center justify-center fixed bottom-0 w-full px-6">
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
  onSettings?: () => void;
}

export function Dialog({
  title,
  children,
  className,
  onBack,
  onClose,
  showLegalNotice = true,
  actions,
  onSettings,
}: DialogProps) {
  return (
    <div
      className={cn("bg-white h-full w-full", className)}
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 75%), url(/images/skybg.webp) lightgray -46.312px 0px / 395.062% 100% no-repeat",
      }}
    >
      <div className={cn("mx-auto h-full relative w-[360px]")}>
        <DialogHeader title={title} onBack={onBack} onClose={onClose} onSettings={onSettings} />
        <div>{children}</div>
        <DialogFooter showLegalNotice={showLegalNotice} actions={actions} />
      </div>
    </div>
  );
}
