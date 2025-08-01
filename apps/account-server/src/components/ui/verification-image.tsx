import Image from 'next/image';

export default function VerificationImage({
  icon,
  image,
}: {
  icon?: React.ReactNode;
  image?: string;
}) {
  return (
    <div className="relative">
      {/* Blue line behind the circle */}
      <div className="w-[128px] h-[2px] rounded-2xl bg-[#37f] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>
      {/* Circle in front */}
      <div className="w-[116px] h-[116px] rounded-full border border-white/32 bg-white/32 shadow-[0_4px_8px_-4px_rgba(37,55,71,0.24),0_0px_24px_0px_rgba(255,255,255,0.92)_inset] backdrop-blur-xs relative z-50 flex items-center justify-center">
        <div className="w-[84px] h-[84px] rounded-full flex items-center justify-center">
          {image && (
            <Image
              src={image}
              alt="Verification Image"
              width={84}
              height={84}
            />
          )}
          {icon && icon}
        </div>
      </div>
      {/* Blur effect */}
      <div className="w-[72px] h-[73px] rounded-[109px] bg-[#37f] blur-[40px] absolute top-[50px] z-0"></div>
      {/* Blur effect */}
      <div className="w-[72px] h-[73px] rounded-[109px] bg-[#37f] blur-[60px] absolute top-[10px] right-[0px] z-0"></div>
    </div>
  );
}
