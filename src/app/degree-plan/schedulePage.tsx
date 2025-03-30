import { FC, useEffect, useRef, useState } from "react";
import { useSchedulesContext } from "../hooks/schedules/schedulesContext";
import { Skeleton } from "@heroui/skeleton";
import TermTable from "./termTable";


export interface SchedulePageProps {}

export const SchedulePage: FC<SchedulePageProps> = ({

}: SchedulePageProps) => {

  const [scheduleSelected, setScheduleSelected] = useState<string | null>(null);
  const initLoadComplete = useRef<boolean | null>(false);
  
  const {
    schedules,
    scheduleMap
  } = useSchedulesContext();

  useEffect(() => {
    if (schedules && !initLoadComplete.current) {
      setScheduleSelected(schedules[0].schedule_id);
      initLoadComplete.current = true;
    }
  }, [schedules]);

  return (
    <div className="flex flex-col gap-0 w-full bg-white shadow-lg py-4">
      <div className="flex flex-col gap-1 px-8 pb-6 pt-2 border-b border-gray-200">
        <p className="heading-md">My Schedules</p>
        <p className="text-sm">Found {schedules?.length || 0}</p>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-col gap-0 w-[20%] border-r border-gray-200">
          {schedules?.map(schedule => (
            <div 
              className="h-20 py-4 px-8 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
              key={schedule.schedule_id}
              onClick={() => {
                setScheduleSelected(schedule.schedule_id);
              }}
            >
              <p className="text-md">{schedule.name}</p>
              <p className="text-sm">{schedule.created_at}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col w-[80%] py-4 px-8">
          <Skeleton isLoaded={scheduleMap != null && scheduleSelected !== null}>
            <p className="heading-sm">{scheduleMap!.get(scheduleSelected!)?.name}</p>
            <TermTable 
              term={'Example'}
            />
          </Skeleton>
        </div>
      </div>
    </div>
  )
}

export default SchedulePage;