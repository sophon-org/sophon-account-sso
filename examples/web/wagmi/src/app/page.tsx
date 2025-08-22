'use client';

import { ConnectButton } from '../../components/connect-button';
import { Loader } from '../../components/loader';
import { Logo } from '../../components/logo';
import { ProfilePanel } from '../../components/profile.panel';

export default function Home() {
  /* const mint = () => {
    writeContract({
      address: '0xbc812793ddc7570b96A5b0A520eB0A6c07c06a6a', // MOCK NFT contract
      abi: nftAbi,
      functionName: 'claim',
      args: [0o000],
    });
  }; */

  // if (!isMounted) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="flex flex-col gap-2 max-w-md items-center">
  //         <Logo className="mb-4" />
  //         <Loader className="mt-4" />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        <ConnectButton />
        <ProfilePanel />
      </div>
    </div>
  );
}
