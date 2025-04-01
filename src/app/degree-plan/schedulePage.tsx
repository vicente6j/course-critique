import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useSchedulesContext } from "../hooks/schedules/schedulesContext";
import ScheduleTable from "./scheduleTable";
import { useSchedulesAssignmentsContext } from "../hooks/scheduleAssignments/scheduleAssignmentsContext";
import { useScheduleEntriesContext } from "../hooks/scheduleEntries/scheduleEntriesContext";
import SelectionDropdown, { SelectionOption } from "../components/selectionDropdown";
import { scheduleTerms } from "../metadata";


export interface SchedulePageProps {}

export const SchedulePage: FC<SchedulePageProps> = ({

}: SchedulePageProps) => {

  const [scheduleSelected, setScheduleSelected] = useState<string | null>(null);
  const [termSelected, setTermSelected] = useState<string | null>(null);
  const initLoadComplete = useRef<boolean | null>(false);
  
  const {
    schedules,
    scheduleMap
  } = useSchedulesContext();

  const {
    entryMap
  } = useScheduleEntriesContext();

  const {
    scheduleAssignmentsMap,
  } = useSchedulesAssignmentsContext();

  useEffect(() => {
    console.log(termSelected);
  }, [termSelected]);

  useEffect(() => {
    if (schedules && scheduleAssignmentsMap && !initLoadComplete.current) {
      setScheduleSelected(schedules[0].schedule_id);
      initLoadComplete.current = true;
    }
  }, [schedules, scheduleAssignmentsMap, initLoadComplete.current]);

  useEffect(() => {
    if (scheduleSelected && scheduleAssignmentsMap && scheduleAssignmentsMap.has(scheduleSelected)) {
      setTermSelected(scheduleAssignmentsMap.get(scheduleSelected)!.term);
    } else {
      setTermSelected(null);
    }
  }, [scheduleSelected, scheduleAssignmentsMap]);

  const termOptions: SelectionOption[] = useMemo(() => {
    const select = {
      label: 'Select a term',
      id: 'select',
      onClick: () => setTermSelected(null)
    };
    const terms = scheduleTerms.map(term => ({
      label: term,
      id: term,
      onClick: () => setTermSelected(term)
    }))

    return [select, ...terms];
  }, []);

  return (
    <div className="flex flex-col gap-0 w-full bg-white shadow-lg py-4">
      <div className="flex flex-col gap-1 px-8 pb-6 pt-2 border-b border-gray-200">
        <p className="heading-md">My Schedules</p>
        <p className="text-sm">Found {schedules?.length || 0}</p>
      </div>
        <div className="flex flex-row justify-between">
        <div className="flex flex-col gap-0 w-[20%] border-r border-gray-200">
          {schedules?.map(schedule => {
            const numEntries = entryMap?.get(schedule.schedule_id)?.length || 0;
            return (
              <div 
                className={`
                  py-4 px-8 border-b border-gray-200 hover:bg-gray-100 cursor-pointer 
                  ${scheduleSelected === schedule.schedule_id ? 'bg-gray-100' : ''}
                `}
                key={schedule.schedule_id}
                onClick={() => {
                  setScheduleSelected(schedule.schedule_id);
                }}
              >
                <p className="text-md">{schedule.name}</p>
                <p className="text-sm">
                  {numEntries} {numEntries === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 w-[80%] py-8 px-8">
          <p className="heading-md font-loose">{scheduleMap!.get(scheduleSelected!)?.name}</p>
          <div className="flex flex-col gap-1">
            <SelectionDropdown 
              options={termOptions}
              selectedOption={termSelected ?? 'select'}
              text={termSelected ?? 'Select a term'}
            />
            <ScheduleTable 
              scheduleId={scheduleMap!.get(scheduleSelected!)?.schedule_id || null}
              term={termSelected}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchedulePage;