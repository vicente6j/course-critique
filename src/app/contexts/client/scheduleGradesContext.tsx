import { useScheduleGrades, UseScheduleGradeValues } from "@/app/hooks/useScheduleGrades";
import { createContext, FC, useContext } from "react";

const ScheduleGradesContext = createContext<UseScheduleGradeValues | undefined>(undefined);

interface ScheduleGradesContextProviderProps {
  children: React.ReactNode;
}

export const ScheduleGradesContextProvider: FC<ScheduleGradesContextProviderProps> = ({
  children,
}: ScheduleGradesContextProviderProps) => {
  
  const grades = useScheduleGrades();

  return (
    <ScheduleGradesContext.Provider value={grades}>
      {children}
    </ScheduleGradesContext.Provider>
  );
}

export const useScheduleGradesContext = (): UseScheduleGradeValues => {
  const context = useContext(ScheduleGradesContext);
  if (context === undefined) {
    throw new Error('useScheduleGradesContext must be used within a ScheduleGradesContextProvider');
  }
  return context;
}