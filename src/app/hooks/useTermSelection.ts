import { useCallback, useState } from "react";
import { termToSortableInteger } from "../home/averageOverTime";

interface UseTermSelectionValue {
  termsSelected: string[] | null;
  handleSelectTerm: (term: string) => void;
  handleUnselectTerm: (term: string) => void;
  setTermsSelected: (terms: string[] | null) => void;
}

export const useTermSelection = (initialTerms: string[] | null = null): UseTermSelectionValue => {
  const [termsSelected, setTermsSelected] = useState<string[] | null>(initialTerms);

  const handleSelectTerm: (term: string) => void = useCallback((term) => {
    setTermsSelected(prev => {
      if (!prev) {
        return [term];
      }
      const newArr = [...prev, term];
      newArr.sort((a: string, b: string) => termToSortableInteger(a) - termToSortableInteger(b));
      return newArr;
    })
  }, []);

  const handleUnselectTerm: (term: string) => void = useCallback((term) => {
    setTermsSelected(prev => prev ? [...prev.filter(el => el !== term)] : null);
  }, []);

  return {
    termsSelected,
    setTermsSelected,
    handleSelectTerm,
    handleUnselectTerm,
  };
};