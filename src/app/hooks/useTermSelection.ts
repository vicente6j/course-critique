import { useCallback, useEffect, useRef, useState } from "react";
import { termToSortableInteger } from "../utils";
import { createTermSelection, deleteTermSelection, TermSelection } from "../api/term-selections";
import { useDatabaseProfile } from "../contexts/server/profile/provider";

export interface UseTermSelectionValue {
  termsSelected: string[] | null;
  handlers: TermSelectionHandlers;
  error: string | null;
}

export interface TermSelectionHandlers {
  handleSelectTerm: (term: string) => Promise<void>;
  handleUnselectTerm: (term: string) => Promise<void>;
}

export const useTermSelection = (): UseTermSelectionValue => {

  const [termsSelected, setTermsSelected] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLoadComplete = useRef<boolean>(false);
  const numUpdates = useRef<number>(0);

  const {
    data,
    revalidate
  } = useDatabaseProfile();

  useEffect(() => {
    if (!initLoadComplete.current && data.termSelections) {
      setTermsSelected(data.termSelections.map(term => term.term));
      initLoadComplete.current = true;
    }
  }, [data.termSelections]);

  const handleSelectTerm: (term: string) => Promise<void> = useCallback(async (term) => {
    if (termsSelected && termsSelected.includes(term)) {
      setError('Already selected this term.');
      return;
    } else if (!data.profile || !data.profile.id) {
      setError('No profile found.');
      return;
    }

    const prevSelections = termsSelected ? [...termsSelected] : [];

    /** Optimistic udpate */
    setTermsSelected(prev => {
      if (!prev) {
        return [term];
      }
      const newArr = [...prev, term];
      newArr.sort((a, b) => termToSortableInteger(a) - termToSortableInteger(b));
      return newArr;
    });

    try {
      await createTermSelection(term, data.profile.id);
      await revalidate.refetchTermSelections();

      numUpdates.current += 1;
    } catch (e) {
      setError(e as string);
      setTermsSelected(prevSelections); /** Reset if failed */
      console.error(e);
    }
  }, [termsSelected, data.profile]);

  const handleUnselectTerm: (term: string) => Promise<void> = useCallback(async (term) => {
    if (termsSelected && !termsSelected.includes(term)) {
      setError('Haven\'t actually selected this term.');
      return;
    } else if (!data.profile || !data.profile.id) {
      setError('No profile found.');
      return;
    }

    const prevSelections = termsSelected ? [...termsSelected] : [];
    /** Optimistic udpate */
    setTermsSelected(prev => prev ? [...prev.filter(el => el !== term)] : null);

    try {
      await deleteTermSelection(term, data.profile.id);
      await revalidate.refetchTermSelections();

      numUpdates.current += 1;
    } catch (e) {
      setError(e as string);
      setTermsSelected(prevSelections); /** Reset if failed */
      console.error(e);
    }
  }, [termsSelected, data.profile]);

  return {
    termsSelected,
    handlers: {
      handleSelectTerm,
      handleUnselectTerm,
    },
    error
  };
};