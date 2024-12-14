import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TermTable, { TermTableRow } from "./termTable";
import { Skeleton } from "@nextui-org/skeleton";
import { ScheduleEntryData, ScheduleInfo } from "../api/degree-plan";
import { useProfile } from "../contexts/profile/provider";


export interface TermGridProps {
}

const allTerms: string[] = [
  'Fall 2021', 'Spring 2022', 'Summer 2022',
  'Fall 2022', 'Spring 2023', 'Summer 2023',
  'Fall 2023', 'Spring 2024', 'Summer 2024',
  'Fall 2024', 'Spring 2025', 'Summer 2025',
  'Fall 2025', 'Spring 2026', 'Summer 2026',
  'Fall 2026', 'Spring 2027', 'Summer 2027',
  'Fall 2027', 'Spring 2028', 'Summer 2028',
  'Fall 2028',
];
const curYear = 2024;

const TermGrid: FC<TermGridProps> = ({

}: TermGridProps) => {
  
  const [scheduleSelected, setScheduleSelected] = useState<string | null>(null);
  const [finalRows, setFinalRows] = useState<Map<string, TermTableRow[]>>(new Map());
  const [scheduleInfoMap, setScheduleInfoMap] = useState<Map<string, ScheduleInfo>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);

  const { profile, scheduleEntries, scheduleInfoData } = useProfile();

  const fetchMySchedule: () => Promise<void> = useCallback(async () => {
    try {
      const schedulesGroupedByTerm = groupByAssignedTerm(scheduleEntries!);
      const finalRows = computeTermTableRows(schedulesGroupedByTerm);
      setFinalRows(finalRows);

      const infoMap = new Map(scheduleInfoData!.map(scheduleInfo => [scheduleInfo.assigned_term, scheduleInfo]));
      setScheduleInfoMap(infoMap);
    } catch {
      console.error('Error encountered while computing final rows and information details.');
    }
    setLoading(false);
  }, [scheduleEntries, scheduleInfoData]);

  useEffect(() => {
    fetchMySchedule();
  }, [fetchMySchedule]);

  const computeTermTableRows: (map: Map<string, ScheduleEntryData[]>) => Map<string, TermTableRow[]> = useCallback((map) => {
    let termMap: Map<string, TermTableRow[]> = new Map();
    for (const term of map.keys()) {
      if (!termMap.has(term)) {
        termMap.set(term, []);
      }
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
   */
  const groupByAssignedTerm: (scheduleEntryData: ScheduleEntryData[]) => Map<string, ScheduleEntryData[]> = useCallback((scheduleEntryData) => {
    let map: Map<string, ScheduleEntryData[]> = new Map();
    allTerms.forEach((term: string) => {
      map.set(term, []);
    });
    for (const entry of scheduleEntryData) {
      if (!entry.assigned_term) {
        continue;
      }
      map.get(entry.assigned_term!)?.push(entry);
    }
    return map;
  }, [allTerms]);

  const myTerms: string[] = useMemo(() => {
    if (!profile) {
      return [];
    } else if (!profile.year) {
      /** If we don't have a year, just set to default */
      const startTerm = `Fall ${curYear}`;
      const i = allTerms.findIndex((term: string) => term === startTerm);
      return i !== -1 ? allTerms.slice(i, i + 12) : [];
    }
    const startYear = curYear - profile.year + 1;
    const startTerm = `Fall ${startYear}`;
    const i = allTerms.findIndex((term: string) => term === startTerm);
    return i !== -1 ? allTerms.slice(i, i + 12) : [];
  }, [profile?.year]);
  
  return (
    <div className="grid grid-cols-2 gap-y-8 gap-x-10 text-md">
      {myTerms.map((term: string) => {
        return (
          <div key={`${term}-${loading}`} className="flex flex-col gap-2">
            <h1 className="heading-sm">{term}</h1>
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
    </div>
  );
}

export default TermGrid;