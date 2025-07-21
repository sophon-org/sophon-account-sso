import { IconSophon } from '@/components/icons/icon-sophon';
import { shortenAddress } from '@/lib/formatting';
import { windowService } from '@/service/window.service';
import type { LoginSuccessProps } from '@/types/auth';

export default function LoginSuccessView({
  accountData,
  sessionPreferences,
  onUseAccount,
  onDisconnect,
}: LoginSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-6">
      <div className="relative">
        {/* Blue line behind the circle */}
        <div className="w-[128px] h-[2px] rounded-2xl bg-[#37f] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>
        {/* Circle in front */}
        <div className="w-[116px] h-[116px] rounded-full border border-white/32 bg-white/32 shadow-[0_4px_8px_-4px_rgba(37,55,71,0.24),0_0px_24px_0px_rgba(255,255,255,0.92)_inset] backdrop-blur-xs relative z-50 flex items-center justify-center">
          <div className="w-[84px] h-[84px] rounded-full bg-white flex items-center justify-center">
            <IconSophon className="w-12 h-12" />
          </div>
        </div>
        {/* Blur effect */}
        <div className="w-[72px] h-[73px] rounded-[109px] bg-[#37f] blur-[40px] absolute top-[50px] z-0"></div>
        {/* Blur effect */}
        <div className="w-[72px] h-[73px] rounded-[109px] bg-[#37f] blur-[60px] absolute top-[10px] right-[0px] z-0"></div>
      </div>

      <h5 className="text-lg font-bold">
        {shortenAddress(accountData.address)}
      </h5>
    </div>
  );
}
