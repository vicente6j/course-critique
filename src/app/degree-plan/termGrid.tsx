import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TermTable, { TermTableRow } from "./termTable";
import { Skeleton } from "@nextui-org/skeleton";
import { ScheduleEntryData, ScheduleInfo } from "../api/degree-plan";
import { useProfile } from "../contexts/profile/provider";
import { ALL_TERMS, Metadata } from "../metadata";
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface TermGridProps {
  termsSelected: string[] | null;
  setTermsSelected: Dispatch<SetStateAction<string[] | null>>;
}

export interface ActionDropdownProps {
  actions: Array<{ 
    label: string;
    onClick: () => void;
  }>;
}

export const ActionDropdown: FC<ActionDropdownProps> = ({
  actions
}: ActionDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div className="relative inline-block">
      <MoreVertIcon 
        style={{ width: '16px', height: '16px' }}
        className={`cursor-pointer p-0 hover:bg-gray-200`}
        onClick={() => {
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <div className="absolute left-0 z-10 w-fit bg-white border border-gray-200 rounded-md shadow-lg">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="block w-fit px-4 py-2 text-left hover:bg-gray-100 text-sm"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

const TermGrid: FC<TermGridProps> = ({
  termsSelected,
  setTermsSelected
}: TermGridProps) => {
  
  const [scheduleSelected, setScheduleSelected] = useState<string | null>(null);
  const [finalRows, setFinalRows] = useState<Map<string, TermTableRow[]>>(new Map());
  const [scheduleInfoMap, setScheduleInfoMap] = useState<Map<string, ScheduleInfo>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);

  const { scheduleEntries, scheduleInfoData } = useProfile();

  const fetchMySchedule: () => Promise<void> = useCallback(async () => {
    const schedulesGroupedByTerm = groupByAssignedTerm(scheduleEntries!);
    const finalRows = computeTermTableRows(schedulesGroupedByTerm);
    setFinalRows(finalRows);

    const infoMap = new Map(scheduleInfoData!.map(scheduleInfo => [scheduleInfo.assigned_term, scheduleInfo]));
    setScheduleInfoMap(infoMap);

    setLoading(false);
  }, [scheduleEntries, scheduleInfoData]);

  useEffect(() => {
    fetchMySchedule();
  }, [fetchMySchedule]);

  const computeTermTableRows: (map: Map<string, ScheduleEntryData[]>) => Map<string, TermTableRow[]> = useCallback((map) => {
    let termMap: Map<string, TermTableRow[]> = new Map(ALL_TERMS.map(term => [term, []]));
    for (const term of ALL_TERMS) {
      for (const scheduleEntry of map.get(term)!) {
        termMap.get(term)?.push({
          key: scheduleEntry.course_id,
          course_id: scheduleEntry.course_id,
        });
      }
    }
    return termMap;
  }, []);

  /**
   * This will contain keys for every term listed in 'allTerms', regardless of 
   * whether the user actually has a schedule assigned to the given term. This way we can
   * easily pass it to the child termTable.
   * 
   * This isn't formatted how the table needs to display it.
   * 
   * Also handles sorting.
   */
  const groupByAssignedTerm: (scheduleEntryData: ScheduleEntryData[]) => Map<string, ScheduleEntryData[]> = useCallback((scheduleEntryData) => {
    let map: Map<string, ScheduleEntryData[]> = new Map(ALL_TERMS.map(term => [term, []]));

    /** If there's no assigned term, skip it. Otherwise, assign it to the term. */
    for (const entry of scheduleEntryData) {
      if (!entry.assigned_term) {
        continue;
      }
      map.get(entry.assigned_term!)?.push(entry);
    }

    /** Sort by date */
    for (const term of map.keys()) {
      map.get(term)!.sort((a, b) => {
        const dateA = new Date(a.inserted_at as string);
        const dateB = new Date(b.inserted_at as string);
        return dateA.getTime() - dateB.getTime();
      });
    }
    return map;
  }, []);

  const getActions: (term: string) => any[] = useCallback((term: string) => {
    return [
      { 
        label: 'Remove', 
        onClick: () => {
          setTermsSelected(prev => {
            return [...prev!.filter(myTerm => myTerm !== term)];
          });
        }
      }
    ]; 
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-y-8 gap-x-10 text-md">
      {termsSelected?.map((term: string) => {
        return (
          <div key={`${term}-${loading}`} className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
              <h1 className="heading-sm">{term}</h1>
              <ActionDropdown
                actions={getActions(term)}
              />
            </div>
            <Skeleton isLoaded={!loading}>
              <TermTable 
                term={term} 
                rows={finalRows.get(term) || []}
                info={scheduleInfoMap.get(term) || null}
                scheduleSelected={scheduleSelected!}
                setScheduleSelected={setScheduleSelected}
              />
            </Skeleton>
          </div>
        );
      })}
      <div className="border border-gray-400 rounded-xl py-2 hover:bg-gray-200 cursor-pointer h-fit">
        <p className="text-md text-center">Add another term</p>
      </div>
    </div>
  );
}

export default TermGrid;