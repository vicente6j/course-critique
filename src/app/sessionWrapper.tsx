'use client';

import { SessionProvider } from "next-auth/react";

/** Need to use a wrapper since NextJS only accepts next-auth/react's SessionProvider within client compnents. */
export const SessionProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};