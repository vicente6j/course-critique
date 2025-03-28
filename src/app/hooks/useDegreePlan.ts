import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useSchedules } from "./useSchedules";
import { useScheduleAssignments } from "./useScheduleAssignments";
import { useTermSelection } from "./useTermSelection";

export interface UseDegreePlanValue {
  termScheduleMap: Map<string, string | null> | null;
  termSelected: string | null;
  handlers: ExposedDegreePlanHandlers;
  error: string | null;
}

export interface ExposedDegreePlanHandlers {
  setTermScheduleMap: Dispatch<SetStateAction<Map<string, string | null> | null>>;
  setTermSelected: (term: string | null) => void;
}

export const useDegreePlan = (): UseDegreePlanValue => {

  /** 
   * Maps each term the user has selected to the schedule ID which lives there
   * (based off the schedule assignments the user has created).
   *  
   * Pass this into the term table so it knows which schedule & entries belong to it.
   */
  const [termScheduleMap, setTermScheduleMap] = useState<Map<string, string | null> | null>(null);

  /** 
   * This is the string of the term we're currently working with, 
   * e.g. 'Fall 2024' -- it delineates which term to apply shortcuts to,
   * e.g. I press cmd-enter and I add a row to the current schedule occupying
   * Fall 2024.
   */
  const [termSelected, setTermSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>('');
  
  const initLoadComplete = useRef<boolean>(false);

  const { 
    assignmentsMap,
  } = useScheduleAssignments();

  const {
    termsSelected,
  } = useTermSelection();

  useEffect(() => {
    if (!initLoadComplete.current && assignmentsMap && termsSelected) {
      setTermScheduleMap(new Map(
        termsSelected.map(term => [term, assignmentsMap.has(term) ? assignmentsMap.get(term)!.schedule_id : null])
      ));
    }
  }, [assignmentsMap, termsSelected]);

  return {
    termScheduleMap,
    handlers: {
      setTermSelected,
      setTermScheduleMap
    },
    termSelected,
    error
  };
};