import { TermSelection } from "@/app/api/term-selections";
import { useTermSelection, UseTermSelectionValue } from "@/app/hooks/useTermSelection";
import { createContext, FC, useContext } from "react";

const TermSelectionContext = createContext<UseTermSelectionValue | undefined>(undefined);

interface TermSelectionProviderProps {
  children: React.ReactNode;
  initialTerms?: TermSelection[] | null;
}

export const TermSelectionProvider: FC<TermSelectionProviderProps> = ({
  children,
}: TermSelectionProviderProps) => {
  
  const termSelection = useTermSelection();

  return (
    <TermSelectionContext.Provider value={termSelection}>
      {children}
    </TermSelectionContext.Provider>
  );
}

export const useTermSelectionContext = (): UseTermSelectionValue => {
  const context = useContext(TermSelectionContext);
  if (context === undefined) {
    throw new Error('useTermSelectionContext must be used within a TermSelectionProvider');
  }
  return context;
}