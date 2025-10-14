'use client';

import dynamic from 'next/dynamic';

const DynamicEmbeddedRoot = dynamic(() => import('./embedded.root'), {
  ssr: false,
});

export default DynamicEmbeddedRoot;
