import { Dispatch, SetStateAction, useState } from "react";

interface UseDegreePlanValue {
  termScheduleMap: Map<string, string> | null;
  setTermScheduleMap: Dispatch<SetStateAction<Map<string, string> | null>>;
  termSelected: string | null;
  setTermSelected: (term: string | null) => void;
}

export const useDegreePlan = (
  initTermScheduleMap: Map<string, string> | null = null, 
  initTermSelected: string | null = null
): UseDegreePlanValue => {

  /** 
   * Maps each selected term to the schedule_id which lives there (for each assignment) 
   * Pass this into the term table so it knows which schedule_id belongs to it.
   */
  const [termScheduleMap, setTermScheduleMap] = useState<Map<string, string> | null>(initTermScheduleMap);

  /** 
   * This is the string of the term we're currently working with, 
   * e.g. 'Fall 2024' -- it delineates which term to apply shortcuts to,
   * e.g. I press cmd-enter and I add a row to the current schedule occupying
   * Fall 2024.
   */
  const [termSelected, setTermSelected] = useState<string | null>(initTermSelected);

  return {
    termScheduleMap,
    setTermScheduleMap,
    termSelected,
    setTermSelected,
  };
};