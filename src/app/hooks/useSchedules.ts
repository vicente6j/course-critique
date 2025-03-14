import { useCallback, useEffect, useRef, useState } from "react";
import { createSchedule, updateSchedule as UpdateScheduleAPI, ScheduleInfo } from "../api/schedule";
import { useDatabaseProfile } from "../contexts/server/profile/provider";

export interface ExposedScheduleHandlers {
  createNewSchedule: (scheduleName: string) => Promise<ScheduleInfo | null>;
  updateSchedule: (scheduleId: string, scheduleName: string) => Promise<ScheduleInfo | null>;
  deleteSchedule: (scheduleId: string) => Promise<boolean | null>;
}

export interface UseSchedulesValue {
  data: {
    schedules: ScheduleInfo[] | null;
  },
  handlers: ExposedScheduleHandlers;
}

export const useSchedules = (): UseSchedulesValue => {

  const [schedules, setSchedules] = useState<ScheduleInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLoadComplete = useRef<boolean>(false);
  const numUpdates = useRef<number>(0);

  const {
    data,
    revalidate
  } = useDatabaseProfile();

  useEffect(() => {
    if (!initLoadComplete.current) {
      setSchedules(data.schedules);
      initLoadComplete.current = true;
    }
  }, [data.schedules]);

  const createNewSchedule: (scheduleName: string) => Promise<ScheduleInfo | null> = useCallback(async (scheduleName) => {
    if (!data.profile || !data.profile.id || !schedules) {
      setError('One of profile (ID) or schedules was null.');
      return null;
    }

    try {

      await createSchedule(data.profile.id, scheduleName);
      const curSchedules: ScheduleInfo[] = [...schedules!];
      const newSchedules: ScheduleInfo[] | null = await revalidate.refetchSchedules();
      /** 
       * curSchedules will help us find the difference between the new schedules and old (i.e. 
       * the new schedule we just created)--in order to fetch its ID.
       */
      const newSchedule = newSchedules!.find(schedule => {
        return !curSchedules.some(oldSchedule => oldSchedule.schedule_id === schedule.schedule_id);
      });
      setSchedules(prev => {
        if (!prev) {
          return [newSchedule!];
        }
        return [...prev, newSchedule!];
      });
      numUpdates.current += 1;

      return newSchedule!;
    } catch (e) {
      setError(e as string);
      console.error(e);
    }
    return null;
  }, [schedules, data.profile, revalidate]);

  const updateSchedule: (
    scheduleId: string, 
    scheduleName: string
  ) => Promise<ScheduleInfo | null> = useCallback(async (
    scheduleId, 
    scheduleName
  ) => {
    if (!data.profile || !data.profile.id || !schedules) {
      setError('One of profile or schedules was null.');
      return null;
    }

    try {
      await UpdateScheduleAPI(scheduleId, scheduleName);
      const newSchedules = await revalidate.refetchSchedules();

      const newSchedule = newSchedules!.find(schedule => schedule.schedule_id === scheduleId)!;
      setSchedules(prev => {
        if (!prev) {
          return null;
        }
        return [
          ...prev.filter(schedule => schedule.schedule_id !== newSchedule?.schedule_id),
          newSchedule
        ];
      });
      numUpdates.current += 1;

      return newSchedule;
    } catch (e) {
      setError(e as string);
      console.error(e);
    }
    return null;
  }, [schedules, data.profile, revalidate]);

  const deleteSchedule: (scheduleId: string) => Promise<boolean> = useCallback(async (scheduleId) => {
    if (!data.profile || !data.profile.id || !schedules) {
      setError('One of profile or schedules was null.');
      return false;
    }

    try {

      await deleteSchedule(scheduleId);
      const newSchedules: ScheduleInfo[] | null = await revalidate.refetchSchedules();

      setSchedules(newSchedules);
      numUpdates.current += 1;

    } catch (e) {
      setError(e as string);
      console.error(e);
      return false;
    }
    return true;
  }, [schedules, data.profile, revalidate]);


  return {
    data: {
      schedules,
    },
    handlers: {
      createNewSchedule,
      updateSchedule,
      deleteSchedule
    }
  };
};