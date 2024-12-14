'use client'
import { createContext, FC, useCallback, useContext, useEffect, useState } from "react";
import { fetchSession } from "../api/auth/[...nextauth]/route";

export interface SessionContextValue {
  session: any | null;
}

export interface SessionProviderProps {
  children: React.ReactNode;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const MySessionProvider: FC<SessionProviderProps> = ({
  children,
}: SessionProviderProps) => {
  
  const [session, setSession] = useState<any | null>(null);

  const getSession: () => void = useCallback(async () => {
    const sessionData = await fetchSession();
    setSession(sessionData);
  }, []);

  useEffect(() => {
    getSession();
  }, [getSession]);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (context === undefined || !context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}