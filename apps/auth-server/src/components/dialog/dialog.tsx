import { cn } from "@/lib/cn";
import { IconClose } from "../icons/icon-close";
import { IconBack } from "../icons/icon-back";
import { IconSophon } from "../icons/icon-sophon";

export const DialogHeader = ({
  title,
  onBack,
  onClose,
}: {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
}) => {
  return (
    <div className="flex justify-between items-center">
      {!!onBack && (
        <button className="text-gray-500 hover:text-gray-700" onClick={onBack}>
          <IconBack className="m-w-6 m-h-6" />
        </button>
      )}
      <h2 className="text-2xl font-bold flex-grow text-center">{title}</h2>
      {!!onClose && (
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          <IconClose className="m-w-6 m-h-6" />
        </button>
      )}
    </div>
  );
};

export const DialogFooter = () => {
  return <div>Dialog Footer</div>;
};

export interface DialogProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
  onClose?: () => void;
}

export function Dialog({
  title,
  children,
  className,
  onBack,
  onClose,
}: DialogProps) {
  return (
    <div
      className={cn(
        "max-w-md w-full space-y-8 p-4 bg-white rounded-2xl shadow",
        className
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 75%), url(/images/skybg.webp) lightgray -46.312px 0px / 395.062% 100% no-repeat",
      }}
    >
      <DialogHeader title={title} onBack={onBack} onClose={onClose} />
      <div>{children}</div>
      <div className="flex items-center justify-center gap-2">
        Powered by <IconSophon className="w-10 h-10" />
      </div>
    </div>
  );
}
