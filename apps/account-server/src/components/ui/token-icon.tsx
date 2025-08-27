import Image from 'next/image';

interface TokenIconProps {
  iconURL: string;
  alt: string;
}

export default function TokenIcon({ iconURL, alt }: TokenIconProps) {
  return (
    <Image
      width={32}
      height={32}
      src={iconURL}
      alt={alt}
      className="w-10 h-10 object-contain rounded-full"
    />
  );
}
