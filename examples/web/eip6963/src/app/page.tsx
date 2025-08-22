"use client";

import { ConnectKitButton, useIsMounted } from "connectkit";
import { Loader } from "../../components/loader";
import { Logo } from "../../components/logo";
import { ProfilePanel } from "../../components/profile.panel";

export default function Home() {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 max-w-md items-center">
          <Logo className="mb-4" />
          <Loader className="mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center h-screen">
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        <ConnectKitButton theme="midnight" />
        <ProfilePanel />
      </div>
    </div>
  );
}
