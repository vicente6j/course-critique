import { useScheduleAssignments, UseScheduleAssignmentsValue } from "@/app/hooks/scheduleAssignments/useScheduleAssignments";
import { createContext, FC, useContext } from "react";

const ScheduleAssignmentsContext = createContext<UseScheduleAssignmentsValue | undefined>(undefined);

interface ScheduleAssignmentsContextProviderProps {
  children: React.ReactNode;
}

export const ScheduleAssignmentsContextProvider: FC<ScheduleAssignmentsContextProviderProps> = ({
  children,
}: ScheduleAssignmentsContextProviderProps) => {
  
  const assignments = useScheduleAssignments();

  return (
    <ScheduleAssignmentsContext.Provider value={assignments}>
      {children}
    </ScheduleAssignmentsContext.Provider>
  );
}

export const useSchedulesAssignmentsContext = (): UseScheduleAssignmentsValue => {
  const context = useContext(ScheduleAssignmentsContext);
  if (context === undefined) {
    throw new Error('useScheduleAssignmentsContext must be used within a ScheduleAssignmentsProvider');
  }
  return context;
}