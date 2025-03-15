import { useCallback, useEffect, useRef, useState } from "react";
import { ScheduleInfo } from "../api/schedule";
import { useDatabaseProfile } from "../contexts/server/profile/provider";
import { createScheduleAssignment, deleteScheduleAssignment, ScheduleAssignment, updateScheduleAssignment } from "../api/schedule-assignments";

export interface ExposedScheduleAssignmentHandlers {
  createNewScheduleAssignment: (scheduleId: string, term: string) => Promise<ScheduleAssignment | null>;
  updateAssignment: (term: string, scheduleId: string) => Promise<ScheduleAssignment | null>;
  deleteAssignment: (term: string) => Promise<boolean | null>;
}

export interface UseScheduleAssignmentsValue {
  data: {
    assignments: ScheduleAssignment[] | null;
  },
  maps: {
    assignmentsMap: Map<string, ScheduleAssignment> | null;
  }
  handlers: ExposedScheduleAssignmentHandlers;
  error: string | null;
}

export const useScheduleAssignments = (): UseScheduleAssignmentsValue => {

  const [assignments, setAssignments] = useState<ScheduleAssignment[] | null>(null);
  const [assignmentsMap, setAssignmentsMap] = useState<Map<string, ScheduleAssignment> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLoadComplete = useRef<boolean>(false);
  const numUpdates = useRef<number>(0);

  const {
    data,
    revalidate
  } = useDatabaseProfile();

  useEffect(() => {
    if (!initLoadComplete.current) {
      setAssignments(data.scheduleAssignments);
      initLoadComplete.current = true;
    }
  }, [data.scheduleAssignments]);

  useEffect(() => {
    setAssignmentsMap(new Map(assignments?.map(assignment => [assignment.term, assignment])));
  }, [assignments]);

  const createNewScheduleAssignment: (
    scheduleId: string, 
    term: string
  ) => Promise<ScheduleAssignment | null> = useCallback(async (scheduleId, term) => {
    if (!assignments || !data.profile || !data.profile.id) {
      setError('One of assignments or data (profile) was null.');
      return null;
    }

    const prevAssignments = [...assignments];
    const newAssignment: ScheduleAssignment = {
      term: term,
      schedule_id: scheduleId,
      user_id: data.profile.id,
      assigned_at: Date.now().toLocaleString(),
    };

    /** Optimistic update */
    setAssignments(prev => [...prev!, newAssignment]);
    try {
      await createScheduleAssignment(scheduleId, term, data.profile.id);
      const newAssignments = await revalidate.refetchScheduleAssignments();

      const newAssignmentReal = newAssignments?.find(assignment => 
        assignment.schedule_id === scheduleId && assignment.term === term
      )!;
      setAssignments(newAssignments);
      numUpdates.current += 1;

      return newAssignmentReal;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return null;
  }, [assignments, data.profile, revalidate]);

  const updateAssignment: (
    term: string,
    scheduleId: string,
  ) => Promise<ScheduleAssignment | null> = useCallback(async (term, scheduleId) => {
    if (!assignments || !data.profile || !data.profile.id) {
      setError('One of assignments or data (profile) was null.');
      return null;
    }

    const prevAssignments = [...assignments];
    /** Optimistic update */
    setAssignments(prev => (
      prev!.map(assignment => 
        assignment.term === term  
          ? { ...assignment, scheduleId: scheduleId }
          : assignment
    )));

    try {
      await updateScheduleAssignment(term, scheduleId, data.profile.id);
      const newAssignments = await revalidate.refetchScheduleAssignments();
      const newAssignment = newAssignments?.find(assignment => assignment.term === term);

      numUpdates.current += 1;
      return newAssignment!;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return null;
  }, [assignments, data.profile, revalidate]);

  const deleteAssignment: (
    term: string,
  ) => Promise<boolean | null> = useCallback(async (term) => {
    if (!assignments || !data.profile || !data.profile.id) {
      setError('One of assignments or data (profile) was null.');
      return false;
    }

    const prevAssignments = [...assignments];
    /** Optimistic update */
    setAssignments(prev => prev?.filter(assignment => assignment.term !== term) || []);

    try {
      await deleteScheduleAssignment(term, data.profile.id);
      await revalidate.refetchScheduleAssignments();

      numUpdates.current += 1;
      return true;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return false;
  }, [assignments, data.profile, revalidate]);

  return {
    data: {
      assignments,
    },
    maps: {
      assignmentsMap
    },
    handlers: {
      createNewScheduleAssignment,
      updateAssignment,
      deleteAssignment
    },
    error
  };
};