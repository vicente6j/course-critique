import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TermTable, { TermTableRow } from "./termTable";
import { Skeleton } from "@nextui-org/skeleton";
import { useProfile } from "../server-contexts/profile/provider";
import { ALL_TERMS, Metadata } from "../metadata";
import { ScheduleAssignment } from "../api/schedule-assignments";
import { ScheduleEntry } from "../api/schedule-entries";
import { ScheduleInfo } from "../api/schedule";
import Dropdown from "../shared/selectionDropdown";
import ActionDropdown from "../shared/actionDropdown";
import { useTermSelectionContext } from "../client-contexts/termSelectionContext";
import { useDegreePlanContext } from "../client-contexts/degreePlanContext";

export interface TermGridProps {}

const TermGrid: FC<TermGridProps> = ({

}: TermGridProps) => {

  const { termSelectionsMap, scheduleAssignmentsMap, scheduleEntryMap, loading } = useProfile();
  const { termsSelected } = useTermSelectionContext();
  const { setTermScheduleMap } = useDegreePlanContext();

  const initLoadComplete = useRef<boolean>(false);

  /**
   * The purpose of this is to simply iterate throughout the assignments
   * we've obtained on the back-end, and if there's a term selection for it (to currently display),
   * fill out a dictionary representing
   *  - term -> schedule_id
   * for rendering a proper table on the client. Obviously, there will only be visible entries
   * for (a) schedules that exist and have an assignment, and (b) a term selection.
   */
  const declareTermScheduleMap: () => void = useCallback(() => {
    if (loading || initLoadComplete.current || !scheduleAssignmentsMap || !scheduleEntryMap || !termSelectionsMap) {
      return;
    }
    let scheduleIdMap: Map<string, string> = new Map();
    for (const term of scheduleAssignmentsMap.keys()) {
      if (!termSelectionsMap.has(term)) {
        continue;
      }
      const assignment: ScheduleAssignment = scheduleAssignmentsMap.get(term)!;
      const schedule_id = assignment.schedule_id;
      scheduleIdMap.set(term, schedule_id);
    }

    setTermScheduleMap(scheduleIdMap);
    initLoadComplete.current = true; /** Only run this upon init request */
  }, [scheduleAssignmentsMap, scheduleEntryMap, termSelectionsMap]);

  useEffect(() => {
    declareTermScheduleMap();
  }, [declareTermScheduleMap]);
  
  return (
    <div className="grid grid-cols-2 gap-y-8 gap-x-10 text-md">
      {(loading ? ALL_TERMS : termsSelected)?.map((term: string) => {
        return (
          <div key={`${term}-${loading}`} className="flex flex-col gap-2">
            <Skeleton isLoaded={!loading}>
              <TermTable term={term}/>
            </Skeleton>
          </div>
        );
      })}
    </div>
  );
}

export default TermGrid;