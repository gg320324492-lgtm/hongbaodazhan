'use client';

import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('../components/pages/HomePage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-cyan-400 font-mono animate-pulse">加载中...</p>
    </div>
  ),
});

export default function Page() {
  return <HomePage />;
}
