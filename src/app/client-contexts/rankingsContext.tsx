'use client'
import { createContext, FC, useContext } from "react";
import { RankingsPageTab, useRankings } from "../hooks/useRankings";
import { RankingsTableRow } from "../rankings/rankingsTable";

interface RankingsContextType {
  tabs: RankingsPageTab[];
  courseRankingsMap: Map<string, RankingsTableRow[]> | null;
  profRankingsMap: Map<string, RankingsTableRow[]> | null;
  loading: boolean;
}

const RankingsContext = createContext<RankingsContextType | undefined>(undefined);

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

export const useRankingsContext = (): RankingsContextType => {
  const context = useContext(RankingsContext);
  if (context === undefined) {
    throw new Error('useRankingsContextProvider must be used within a RankingsProvider');
  }
  return context;
}