import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { createSchedule, ScheduleInfo, deleteSchedule } from "../api/schedule";
import { createScheduleAssignment, deleteScheduleAssignment, updateScheduleAssignment } from "../api/schedule-assignments";
import { useDatabaseProfile } from "../contexts/server/profile/provider";

interface UseDegreePlanValue {
  termScheduleMap: Map<string, string> | null;
  setTermScheduleMap: Dispatch<SetStateAction<Map<string, string> | null>>;
  termSelected: string | null;
  setTermSelected: (term: string | null) => void;
  replaceScheduleAssignment: (schedule: ScheduleInfo | null) => void;
  createNewSchedule: (scheduleName: string) => Promise<ScheduleInfo | null>;
  tempInfoObject: ScheduleInfo | null;
  isEditing: boolean | null;
  setIsEditing: Dispatch<SetStateAction<boolean | null>>;
  scheduleEdited: string | null;
  setScheduleEdited: Dispatch<SetStateAction<string | null>>;
  deleteSchedulePing: (schedule: ScheduleInfo) => Promise<void>;
  error: string | null;
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
  const [scheduleEdited, setScheduleEdited] = useState<string | null>(null);

  const { 
    data,
    revalidate
  } = useDatabaseProfile();

  /**
   * If there's no term currently selected, then this function doesn't really have a purpose
   * (as it's just meant to modify existing assignments from term -> schedule_id).
   * 
   * Therefore set the error field.
   * 
   * @param schedule schedule to update for the selected term
   */
  const replaceScheduleAssignment: (schedule: ScheduleInfo | null) => void = useCallback(async (schedule) => {
    if (!data.profile?.id || !data.scheduleAssignments) {
      setError('Profile or assignments weren\'t found.');
      return;
    } else if (!termSelected) {
      setError('There was no term selected to begin working with.');
      return;
    }

    try {
      if (schedule === null) {
        setTermScheduleMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(termSelected);
          return newMap;
        });

        /** Clears the selection */
        await deleteScheduleAssignment(termSelected, data.profile!.id);
        await revalidate.refetchScheduleAssignments();

        return;
      }

      /** This rerenders the entire component, since we're effectively passing in a new scheduleId */
      setTermScheduleMap(prev => {
        const newMap = new Map(prev);
        newMap.set(termSelected, schedule.schedule_id);
        return newMap;
      });

      if (data.scheduleAssignments.some(assignment => assignment.term === termSelected)) {
        await updateScheduleAssignment(termSelected, schedule!.schedule_id!, data.profile.id);
      } else {
        await createScheduleAssignment(schedule!.schedule_id!, termSelected, data.profile.id);
      }
      await revalidate.refetchScheduleAssignments();

    } catch (e) {
      setError(e as string);
      console.error(e);
    }

  }, [data.profile, data.scheduleAssignments, termSelected]);

  const deleteSchedulePing: (schedule: ScheduleInfo | null) => Promise<void> = useCallback(async (schedule) => {
    if (!data.profile || !data.schedules) {
      setError('One of profile or schedules was null.');
      return;
    }

    try {

      if (termSelected) {
        setTermScheduleMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(termSelected);
          return newMap;
        });
      }

      await deleteSchedule(schedule?.schedule_id!);
      await refetchSchedules();
      /** 
       * Even though we handle deletion of the assignment via SQL cascade,
       * still refetch the new assignments.
       */
      await refetchScheduleAssignments();
      
    } catch (e) {
      setError(e as string);
      console.error(e);
    }
  }, [profile, schedules, termSelected]);

  /**
   * Return the new schedule after creation
   * (in order to update e.g. schedule dropdown).
   * 
   * Importantly, this function has to wait for pinging the back-end to retrieve the actual real
   * schedule information (id) which is generated on the back-end.
   * @param scheduleName name of new schedule
   * @returns the new schedule object
   */
  const createNewSchedule: (scheduleName: string) => Promise<ScheduleInfo | null> = useCallback(async (scheduleName) => {
    if (!profile || !schedules) {
      setError('One of profile or schedules was null.');
      return null;
    }
    /** There might not be a term selected, but still create the schedule */

    try {
      /**
       * Do this so that we can catch the brief case of a temp schedule_id and render what we want.
       */
      const tempSchedule: ScheduleInfo = {
        schedule_id: 'temp',
        user_id: profile.id,
        name: scheduleName,
        created_at: '',
        updated_at: '',
      };
      setTempInfoObject(tempSchedule);

      /** If we're currently working on a degree plan */
      if (termSelected) {
        setTermScheduleMap(prev => {
          const newMap = new Map(prev);
          newMap.set(termSelected, tempSchedule.schedule_id);
          return newMap;
        });
        /**
         * At this point the UX will have hopefully correctly rendered the name
         * and the empty schedule.
         */
      }

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

      /** 
       * Again, if we have a term selected, update it to the new schedule we just added
       * and ping the schedule assignment API.
       */
      if (termSelected) {

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
      }
      setTempInfoObject(null);

      return newSchedule!;

    } catch (e) {
      setError(e as string);
      console.error(e);
    }
    return null;
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
    setIsEditing,
    scheduleEdited,
    setScheduleEdited,
    deleteSchedulePing
  };
};