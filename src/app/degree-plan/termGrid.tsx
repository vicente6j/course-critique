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
  
  const [scheduleSelected, setScheduleSelected] = useState<string | null>(null);
  const [rowMap, setRowMap] = useState<Map<string, TermTableRow[]>>(new Map());

  /** Maps each selected term to the schedule_id which lives there (for each assignment) */
  const [scheduleIdMap, setScheduleIdMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);

  const { termSelectionsMap, scheduleAssignmentsMap, scheduleEntryMap, scheduleMap } = useProfile();

  /**
   * The purpose of this is to simply iterate throughout the assignments
   * we've obtained on the back-end, and if there's a term selection for it (to currently display),
   * fill out a dictionary representing
   *  term -> { key: , course_id: }
   * for rendering a proper table on the client. Obviously, there will only be visible entries
   * for (a) schedules that exist and have an assignment, and (b) a term selection.
   */
  const fetchMyEntries: () => void = useCallback(() => {
    if (!scheduleAssignmentsMap || !scheduleEntryMap) {
      return;
    }

    let termMap: Map<string, TermTableRow[]> = new Map();
    let scheduleIdMap: Map<string, string> = new Map();
    for (const term of scheduleAssignmentsMap?.keys()!) {
      if (!termSelectionsMap?.has(term)) {
        continue;
      }
      const assignment: ScheduleAssignment = scheduleAssignmentsMap!.get(term)!;
      const schedule_id = assignment.schedule_id;
      scheduleIdMap.set(term, schedule_id);
      const entries: ScheduleEntry[] = scheduleEntryMap?.get(schedule_id)!;
      /** Sort by insertion time */
      entries.sort((a, b) => {
        const dateA = new Date(a.inserted_at as string);
        const dateB = new Date(b.inserted_at as string);
        return dateA.getTime() - dateB.getTime();
      })
      termMap.set(term, []);
      for (const entry of entries) {
        termMap.get(term)?.push({
          key: entry.course_id!,
          course_id: entry.course_id!,
        });
      }
    }
    setScheduleIdMap(scheduleIdMap);
    setLoading(false);
    setRowMap(termMap);
  }, [scheduleAssignmentsMap, scheduleEntryMap, termSelectionsMap]);

  const replaceScheduleAssignment: (term: string, schedule: ScheduleInfo) => void = useCallback((term, schedule) => {
    setRowMap(prev => {
      const newMap = new Map(prev);
      newMap.set(term, []);
      const entries: ScheduleEntry[] = scheduleEntryMap?.get(schedule.schedule_id)!;
      for (const entry of entries) {
        newMap.get(term)?.push({
          key: entry.course_id!,
          course_id: entry.course_id!,
        });
      }
      return newMap;
    })
    setScheduleIdMap(prev => {
      const newMap = new Map(prev);
      newMap.set(term, schedule.schedule_id);
      return newMap;
    })
  }, [scheduleEntryMap]);

  useEffect(() => {
    fetchMyEntries();
  }, [fetchMyEntries]);

  const getOptions: (term: string) => any[] = useCallback((term: string) => {
    return [
      { 
        label: 'Remove', 
        onClick: () => {
          handleUnselectTerm(term);
        }
      }
    ]; 
  }, []);

  const trigger: React.ReactNode = useMemo(() => {
    return (
      <MoreVertIcon 
        style={{ width: '16px', height: '16px' }}
        className={`cursor-pointer p-0 hover:bg-gray-200`}
      />
    )
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-y-8 gap-x-10 text-md">
      {termsSelected?.map((term: string) => {
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
                rows={rowMap.get(term) || []}
                info={scheduleMap?.get(scheduleIdMap.get(term)!) || null}
                scheduleSelected={scheduleSelected!}
                setScheduleSelected={setScheduleSelected}
                replaceScheduleAssignment={replaceScheduleAssignment}
              />
            </Skeleton>
          </div>
        );
      })}
    </div>
  );
}

export default TermGrid;