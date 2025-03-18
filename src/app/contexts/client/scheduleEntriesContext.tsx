import { useScheduleEntries, UseScheduleEntriesValue } from "@/app/hooks/useScheduleEntries";
import { createContext, FC, useContext } from "react";

const ScheduleEntriesContext = createContext<UseScheduleEntriesValue | undefined>(undefined);

interface ScheduleEntriesContextProviderProps {
  children: React.ReactNode;
}

export const ScheduleEntriesContextProvider: FC<ScheduleEntriesContextProviderProps> = ({
  children,
}: ScheduleEntriesContextProviderProps) => {
  
  const entries = useScheduleEntries();

  return (
    <ScheduleEntriesContext.Provider value={entries}>
      {children}
    </ScheduleEntriesContext.Provider>
  );
}

export const useScheduleEntriesContext = (): UseScheduleEntriesValue => {
  const context = useContext(ScheduleEntriesContext);
  if (context === undefined) {
    throw new Error('ScheduleEntriesContext must be used within a ScheduleEntriesContextProvider');
  }
  return context;
}