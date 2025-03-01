import { ScheduleInfo } from "@/app/api/schedule";
import { useDegreePlan } from "@/app/hooks/useDegreePlan";
import { createContext, Dispatch, FC, SetStateAction, useContext } from "react";

interface DegreePlanContextType {
  termSelected: string | null;
  setTermSelected: (term: string | null) => void;
  termScheduleMap: Map<string, string> | null;
  setTermScheduleMap: Dispatch<SetStateAction<Map<string, string> | null>>;
  error: string | null;
  replaceScheduleAssignment: (schedule: ScheduleInfo | null) => void;
  createNewSchedule: (scheduleName: string) => Promise<ScheduleInfo | null>;
  tempInfoObject: ScheduleInfo | null;
  isEditing: boolean | null;
  setIsEditing: Dispatch<SetStateAction<boolean | null>>;
  scheduleEdited: string | null;
  setScheduleEdited: Dispatch<SetStateAction<string | null>>;
  deleteSchedulePing: (schedule: ScheduleInfo) => Promise<void>;
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