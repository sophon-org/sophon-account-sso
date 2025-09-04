'use client';

import { signOut, useSession } from 'next-auth/react';
import { LoginButton } from '@/components/login';

export default function Home() {
  const { data: session } = useSession();
  let block = <LoginButton />;
  if (session?.user?.id) {
    block = (
      <>
        <div style={{ marginBottom: 16 }}>
          You are authenticated as {session.user.id}
        </div>
        <button
          type="button"
          style={{
            backgroundColor: 'purple',
            padding: 10,
            borderRadius: 16,
            color: 'white',
            cursor: 'pointer',
          }}
          onClick={() => signOut()}
        >
          Logout
        </button>
      </>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 style={{ marginBottom: 16 }}>
        Sophon Authentication With Next-Auth{' '}
      </h1>
      {block}
    </div>
  );
}
