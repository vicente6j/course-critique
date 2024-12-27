import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TermTable, { TermTableRow } from "./termTable";
import { Skeleton } from "@nextui-org/skeleton";
import { useProfile } from "../contexts/profile/provider";
import { ALL_TERMS, Metadata } from "../metadata";
import { ScheduleAssignment } from "../api/schedule-assignments";
import { ScheduleEntry } from "../api/schedule-entries";
import { ScheduleInfo } from "../api/schedule";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Dropdown from "../shared/selectionDropdown";
import ActionDropdown from "../shared/actionDropdown";

export interface TermGridProps {
  termsSelected: string[] | null;
  handleUnselectTerm: (term: string) => void;
}

const TermGrid: FC<TermGridProps> = ({
  termsSelected,
  handleUnselectTerm
}: TermGridProps) => {
  
  /** 
   * This is the string of the term we're currently working with, 
   * e.g. 'Fall 2024' -- it delineates which term to apply shortcuts to,
   * e.g. I press cmd-enter and I add a row to the current schedule occupying
   * Fall 2024.
   */
  const [termSelected, setTermSelected] = useState<string | null>(null);

  /** 
   * Maps each selected term to the schedule_id which lives there (for each assignment) 
   * Pass this into the term table so it knows which schedule_id belongs to it.
   */
  const [termScheduleMap, setTermScheduleMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);

  const { termSelectionsMap, scheduleAssignmentsMap, scheduleEntryMap } = useProfile();

  /**
   * The purpose of this is to simply iterate throughout the assignments
   * we've obtained on the back-end, and if there's a term selection for it (to currently display),
   * fill out a dictionary representing
   *  - term -> schedule_id
   * for rendering a proper table on the client. Obviously, there will only be visible entries
   * for (a) schedules that exist and have an assignment, and (b) a term selection.
   */
  const declareTermScheduleMap: () => void = useCallback(() => {
    if (!scheduleAssignmentsMap || !scheduleEntryMap) {
      return;
    }

    let scheduleIdMap: Map<string, string> = new Map();
    for (const term of scheduleAssignmentsMap?.keys()!) {
      if (!termSelectionsMap?.has(term)) {
        continue;
      }
      const assignment: ScheduleAssignment = scheduleAssignmentsMap!.get(term)!;
      const schedule_id = assignment.schedule_id;
      scheduleIdMap.set(term, schedule_id);
    }
    setTermScheduleMap(scheduleIdMap);
    setLoading(false);
  }, [scheduleAssignmentsMap, scheduleEntryMap, termSelectionsMap]);

  useEffect(() => {
    declareTermScheduleMap();
  }, [declareTermScheduleMap]);

  const getOptions: (term: string) => Array<{ 
    label: string;
    onClick: () => void;
  }> = useCallback((term) => {
    return [
      { 
        label: 'Remove', 
        onClick: () => {
          handleUnselectTerm(term);
        }
      }
    ]; 
  }, []);

  const trigger: React.ReactNode = useMemo(() => (
    <MoreVertIcon 
      style={{ width: '16px', height: '16px' }}
      className={`cursor-pointer p-0 hover:bg-gray-200`}
    />
  ), []);
  
  return (
    <div className="grid grid-cols-2 gap-y-8 gap-x-10 text-md">
      {termsSelected?.map((term: string) => { /** In the future we can make a hook for termsSelected and selections */
        return (
          <div key={`${term}-${loading}`} className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
              <h1 className="heading-sm">{term}</h1>
              <ActionDropdown
                options={getOptions(term)}
                trigger={trigger}
              />
            </div>
            <Skeleton isLoaded={!loading}>
              <TermTable 
                term={term} 
                scheduleId={termScheduleMap.get(term) ?? null}
                termSelected={termSelected!}
                setTermSelected={setTermSelected}
                setTermScheduleMap={setTermScheduleMap}
              />
            </Skeleton>
          </div>
        );
      })}
    </div>
  );
}

export default TermGrid;