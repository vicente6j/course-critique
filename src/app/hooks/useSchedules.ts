import { useCallback, useEffect, useRef, useState } from "react";
import { createSchedule as createSchedulePing, updateSchedule as updateSchedulePing, deleteSchedule as deleteSchedulePing, ScheduleInfo } from "../api/schedule";
import { useDatabaseProfile } from "../contexts/server/profile/provider";

export interface ExposedScheduleHandlers {
  createSchedule: (scheduleName: string) => Promise<ScheduleInfo | null>;
  updateSchedule: (scheduleId: string, scheduleName: string) => Promise<ScheduleInfo | null>;
  deleteSchedule: (scheduleId: string) => Promise<boolean | null>;
}

export interface UseSchedulesValue {
  schedules: ScheduleInfo[] | null;
  scheduleMap: Map<string, ScheduleInfo> | null;
  handlers: ExposedScheduleHandlers;
  error: string | null;
}

export const useSchedules = (): UseSchedulesValue => {

  const [schedules, setSchedules] = useState<ScheduleInfo[] | null>(null);
  const [scheduleMap, setScheduleMap] = useState<Map<string, ScheduleInfo> | null>(null);
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

  useEffect(() => {
    /** Simply populate a map for every schedule change */
    setScheduleMap(new Map(schedules?.map(schedule => [schedule.schedule_id, schedule])));
  }, [schedules]);

  const createSchedule: (
    scheduleName: string
  ) => Promise<ScheduleInfo | null> = useCallback(async (scheduleName) => {
    if (!data.profile || !data.profile.id || !schedules) {
      setError('One of profile (ID) or schedules was null.');
      return null;
    }

    const prevSchedules = [...schedules];
    const tempSchedule: ScheduleInfo = {
      schedule_id: 'temp-schedule',
      user_id: data.profile.id,
      name: 'temp-schedule',
      created_at: Date.now().toLocaleString(),
      updated_at: Date.now().toLocaleString(),
    };

    /** Optimistic update with temporary schedule */
    setSchedules(prev => {
      return prev ? [...prev, tempSchedule] : [tempSchedule];
    });
    
    try {
      await createSchedulePing(data.profile.id, scheduleName);
      const newSchedules = await revalidate.refetchSchedules();

      const newSchedule = newSchedules!.find(schedule => (
        !prevSchedules.some(oldSchedule => oldSchedule.schedule_id === schedule.schedule_id)
      ));
      setSchedules([
        ...prevSchedules,
        newSchedule!
      ]);

      numUpdates.current += 1;
      return newSchedule!;
    } catch (e) {
      setError(e as string);
      setSchedules(prevSchedules);
      console.error(e);
    }
    return null;
  }, [schedules, data.profile, revalidate]);

  const updateSchedule: (
    scheduleId: string, 
    scheduleName: string
  ) => Promise<ScheduleInfo | null> = useCallback(async (scheduleId, scheduleName) => {
    if (!schedules) {
      setError('Schedules was null.');
      return null;
    }

    const prevSchedules = [...schedules];
    /** Optimistic update with new name */
    setSchedules(prev => (
      prev!.map(schedule => 
        schedule.schedule_id === scheduleId 
          ? { ...schedule, name: scheduleName }
          : schedule
    )));

    try {
      await updateSchedulePing(scheduleId, scheduleName);
      const newSchedules = await revalidate.refetchSchedules();

      const updatedSchedule = newSchedules?.find(schedule => (schedule.schedule_id === scheduleId))!;

      numUpdates.current += 1;
      return updatedSchedule;
    } catch (e) {
      setError(e as string);
      setSchedules(prevSchedules); /** Reset if failed */
      console.error(e);
    }
    return null;
  }, [schedules, revalidate]);

  const deleteSchedule: (scheduleId: string) => Promise<boolean | null> = useCallback(async (scheduleId) => {
    if (!schedules) {
      setError('Schedules was null.');
      return false;
    }

    const prevSchedules = [...schedules];
    setSchedules(prev => (
      prev!.filter(schedule => schedule.schedule_id !== scheduleId)
    ));

    try {
      await deleteSchedulePing(scheduleId);
      await revalidate.refetchSchedules();

      numUpdates.current += 1;
      return true;
    } catch (e) {
      setError(e as string);
      setSchedules(prevSchedules);
      console.error(e);
    }
    return false;
  }, [schedules, revalidate]);


  return {
    schedules,
    scheduleMap,
    handlers: {
      createSchedule,
      updateSchedule,
      deleteSchedule
    },
    error
  };
};