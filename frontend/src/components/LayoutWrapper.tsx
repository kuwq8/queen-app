'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that should take wide width on desktop (like WhatsApp Web)
  // Match exactly /communities/[id] pattern (and not /communities/create)
  const isChannelPage = pathname?.match(/^\/communities\/[a-zA-Z0-9-]+$/);

  if (isChannelPage) {
    return (
      <div className="w-full max-w-4xl min-h-[100dvh] mx-auto bg-[#0b141a] border-x border-white/10 flex flex-col relative shadow-2xl overflow-hidden">
        {children}
      </div>
    );
  }

  // Default mobile-like constrained layout for the rest of the app
  return (
    <div className="w-full max-w-md sm:max-w-lg min-h-screen bg-black border-x border-white/10 flex flex-col relative shadow-2xl">
      {children}
    </div>
  );
}
