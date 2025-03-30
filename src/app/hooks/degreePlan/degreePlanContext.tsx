import { createContext, FC, useContext } from "react";
import { useDegreePlan, UseDegreePlanValue } from "../degreePlan/useDegreePlan";

const DegreePlanContext = createContext<UseDegreePlanValue | undefined>(undefined);

interface DegreePlanContextProviderProps {
  children: React.ReactNode;
}

export const DegreePlanContextProvider: FC<DegreePlanContextProviderProps> = ({
  children,
}: DegreePlanContextProviderProps) => {
  
  const degreeplan = useDegreePlan();

  return (
    <DegreePlanContext.Provider value={degreeplan}>
      {children}
    </DegreePlanContext.Provider>
  );
}

export const useDegreePlanContext = (): UseDegreePlanValue => {
  const context = useContext(DegreePlanContext);
  if (context === undefined) {
    throw new Error('useDegreePlanContext must be used within a DegreePlanContextProvider');
  }
  return context;
}