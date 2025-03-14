'use client'
import { useRankings, UseRankingsValue } from "@/app/hooks/useRankings";
import { createContext, FC, useContext } from "react";

const RankingsContext = createContext<UseRankingsValue | undefined>(undefined);

interface RankingsProviderProps {
  children: React.ReactNode;
}

export const RankingsContextProvider: FC<RankingsProviderProps> = ({
  children,
}: RankingsProviderProps) => {

  const rankings = useRankings();

  return (
    <RankingsContext.Provider value={rankings}>
      {children}
    </RankingsContext.Provider>
  );
}

export const useRankingsContext = (): UseRankingsValue => {
  const context = useContext(RankingsContext);
  if (context === undefined) {
    throw new Error('useRankingsContextProvider must be used within a RankingsProvider');
  }
  return context;
}