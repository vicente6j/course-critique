import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { createSchedule, ScheduleInfo } from "../api/schedule";
import { useProfile } from "../server-contexts/profile/provider";
import { createScheduleAssignment, deleteScheduleAssignment, updateScheduleAssignment } from "../api/schedule-assignments";

interface UseDegreePlanValue {
  termScheduleMap: Map<string, string> | null;
  setTermScheduleMap: Dispatch<SetStateAction<Map<string, string> | null>>;
  termSelected: string | null;
  setTermSelected: (term: string | null) => void;
  error: string | null;
  replaceScheduleAssignment: (schedule: ScheduleInfo | string) => void;
  createNewSchedule: (scheduleName: string) => void;
  tempInfoObject: ScheduleInfo | null;
  isEditing: boolean | null;
  setIsEditing: Dispatch<SetStateAction<boolean | null>>;
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

  /**
   * The purpose of this temp info object is to reduce the latency between
   * creating a new schedule and actually seeing it on the client. e.g. I hit
   * create a new schedule, but I have yet to retrieve the new schedule object
   * from the back-end. So use this temp info object for rendering and swap it out
   * later.
   */
  const [tempInfoObject, setTempInfoObject] = useState<ScheduleInfo | null>(null);
  const [error, setError] = useState<string | null>('');
  const [isEditing, setIsEditing] = useState<boolean | null>(false);

  const { profile, schedules, refetchSchedules, scheduleAssignments, refetchScheduleAssignments } = useProfile();

  const replaceScheduleAssignment: (schedule: ScheduleInfo | string) => void = useCallback(async (schedule) => {
    if (!profile || !scheduleAssignments || !termSelected) {
      setError('Profile or assignments or termSelected weren\'t found.');
      return;
    }

    try {
      if (typeof schedule === 'string') {
        if (schedule !== 'Select a schedule') {
          setError('Invalid schedule selection');
          return;
        }

        setTermScheduleMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(termSelected);
          return newMap;
        });

        /** Clears the selection */
        await deleteScheduleAssignment(termSelected, profile!.id);
        await refetchScheduleAssignments();

        return;
      }

      /** This rerenders the entire component, since we're effectively passing in a new scheduleId */
      setTermScheduleMap(prev => {
        const newMap = new Map(prev);
        newMap.set(termSelected, schedule.schedule_id);
        return newMap;
      });

      if (scheduleAssignments.some(assignment => assignment.term === termSelected)) {
        await updateScheduleAssignment(termSelected, schedule!.schedule_id!, profile!.id);
      } else {
        await createScheduleAssignment(schedule!.schedule_id!, termSelected, profile!.id);
      }
      await refetchScheduleAssignments();

    } catch (e) {
      setError(e as string);
      console.error(e);
    }

  }, [profile, scheduleAssignments, termSelected]);

  const createNewSchedule: (scheduleName: string) => void = useCallback(async (scheduleName) => {
    if (!profile || !schedules || !termSelected) {
      setError('One of profile or schedules or termSelected was null.');
      return;
    }

    try {
      const tempSchedule: ScheduleInfo = {
        schedule_id: 'temp',
        user_id: profile.id,
        name: scheduleName,
        created_at: '',
        updated_at: '',
      };
      setTempInfoObject(tempSchedule);
      /**
       * Do this so that we can catch the brief case of a temp schedule_id and render what we want.
       */
      setTermScheduleMap(prev => {
        const newMap = new Map(prev);
        newMap.set(termSelected, tempSchedule.schedule_id);
        return newMap;
      });

      /**
       * At this point the UX will have hopefully correctly rendered the name
       * and the empty schedule.
       */

      await createSchedule(profile!.id, scheduleName);
      const curSchedules: ScheduleInfo[] = [...schedules!];
      const newSchedules: ScheduleInfo[] | null = await refetchSchedules();
      /** 
       * curSchedules will help us find the difference between the new schedules and old (i.e. 
       * the new schedule we just created).
       */
      const newSchedule = newSchedules!.find(schedule => {
        return !curSchedules.some(oldSchedule => oldSchedule.schedule_id === schedule.schedule_id);
      });

      if (scheduleAssignments?.find(assignment => assignment.term === termSelected)) {
        await updateScheduleAssignment(termSelected, newSchedule!.schedule_id!, profile!.id);
      } else {
        await createScheduleAssignment(newSchedule!.schedule_id!, termSelected, profile!.id);
      }
      await refetchScheduleAssignments();

      setTermScheduleMap(prev => {
        const newMap = new Map(prev);
        newMap.set(termSelected, newSchedule!.schedule_id);
        return newMap;
      });
      setTempInfoObject(null);

    } catch (e) {
      setError(e as string);
      console.error(e);
    }
  }, [schedules, profile, scheduleAssignments, termSelected]);

  return {
    termScheduleMap,
    setTermScheduleMap,
    termSelected,
    setTermSelected,
    error,
    replaceScheduleAssignment,
    createNewSchedule,
    tempInfoObject,
    isEditing,
    setIsEditing
  };
};