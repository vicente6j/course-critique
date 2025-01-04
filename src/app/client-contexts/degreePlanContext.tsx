import { createContext, Dispatch, FC, SetStateAction, useContext } from "react";
import { useDegreePlan } from "../hooks/useDegreePlan";
import { ScheduleInfo } from "../api/schedule";

interface DegreePlanContextType {
  termSelected: string | null;
  setTermSelected: (term: string | null) => void;
  termScheduleMap: Map<string, string> | null;
  setTermScheduleMap: Dispatch<SetStateAction<Map<string, string> | null>>;
  error: string | null;
  replaceScheduleAssignment: (schedule: ScheduleInfo | string) => void;
  createNewSchedule: (scheduleName: string) => void;
  tempInfoObject: ScheduleInfo | null;
  isEditing: boolean | null;
  setIsEditing: Dispatch<SetStateAction<boolean | null>>;
}

const DegreePlanContext = createContext<DegreePlanContextType | undefined>(undefined);

interface DegreePlanProviderProps {
  children: React.ReactNode;
  initialTermSelected?: string | null;
  initialTermScheduleMap?: Map<string, string> | null;
}

export const DegreePlanContextProvider: FC<DegreePlanProviderProps> = ({
  children,
  initialTermSelected = null,
  initialTermScheduleMap = null
}: DegreePlanProviderProps) => {
  
  const degreePlan = useDegreePlan(initialTermScheduleMap, initialTermSelected);

  return (
    <DegreePlanContext.Provider value={degreePlan}>
      {children}
    </DegreePlanContext.Provider>
  );
}

export const useDegreePlanContext = (): DegreePlanContextType => {
  const context = useContext(DegreePlanContext);
  if (context === undefined) {
    throw new Error('useDegreePlanContext must be used within a DegreePlanContextProvider');
  }
  return context;
}