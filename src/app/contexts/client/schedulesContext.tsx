import { useSchedules, UseSchedulesValue } from "@/app/hooks/useSchedules";
import { createContext, FC, useContext } from "react";

const SchedulesContext = createContext<UseSchedulesValue | undefined>(undefined);

interface SchedulesContextProviderProps {
  children: React.ReactNode;
}

export const SchedulesContextProvider: FC<SchedulesContextProviderProps> = ({
  children,
}: SchedulesContextProviderProps) => {
  
  const schedules = useSchedules();

  return (
    <SchedulesContext.Provider value={schedules}>
      {children}
    </SchedulesContext.Provider>
  );
}

export const useSchedulesContext = (): UseSchedulesValue => {
  const context = useContext(SchedulesContext);
  if (context === undefined) {
    throw new Error('useSchedulesContext must be used within a SchedulesContextProvider');
  }
  return context;
}