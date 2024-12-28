import { createContext, FC, useContext } from "react";
import { useTermSelection } from "../hooks/useTermSelection";

interface TermSelectionContextType {
  termsSelected: string[] | null;
  handleSelectTerm: (term: string) => void;
  handleUnselectTerm: (term: string) => void;
  setTermsSelected: (terms: string[] | null) => void;
}

const TermSelectionContext = createContext<TermSelectionContextType | undefined>(undefined);

interface TermSelectionProviderProps {
  children: React.ReactNode;
  initialTerms?: string[] | null;
}

export const TermSelectionProvider: FC<TermSelectionProviderProps> = ({
  children,
  initialTerms = null /** Is defined as null initially, but set later */
}: TermSelectionProviderProps) => {
  
  const termSelection = useTermSelection(initialTerms);

  return (
    <TermSelectionContext.Provider value={termSelection}>
      {children}
    </TermSelectionContext.Provider>
  );
}

export const useTermSelectionContext = (): TermSelectionContextType => {
  const context = useContext(TermSelectionContext);
  if (context === undefined) {
    throw new Error('useTermSelectionContext must be used within a TermSelectionProvider');
  }
  return context;
}