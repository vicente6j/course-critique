import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabaseProfile } from "../../contexts/server/profile/provider";
import { createScheduleAssignment, deleteScheduleAssignment, ScheduleAssignment, updateScheduleAssignment } from "../../api/schedule-assignments";

export interface ExposedScheduleAssignmentHandlers {
  createAssignment: (userId: string, scheduleId: string, term: string) => Promise<ScheduleAssignment | null>;
  updateAssignment: (userId: string, term: string, newScheduleId: string) => Promise<ScheduleAssignment | null>;
  deleteAssignment: (userId: string, term: string) => Promise<boolean | null>;
}

export interface UseScheduleAssignmentsValue {
  assignments: ScheduleAssignment[] | null;
  termAssignmentsMap: Map<string, ScheduleAssignment> | null;
  scheduleAssignmentsMap: Map<string, ScheduleAssignment> | null;
  handlers: ExposedScheduleAssignmentHandlers;
  error: string | null;
}

export const useScheduleAssignments = (): UseScheduleAssignmentsValue => {

  const [assignments, setAssignments] = useState<ScheduleAssignment[] | null>(null);
  const [termAssignmentsMap, setTermAssignmentsMap] = useState<Map<string, ScheduleAssignment> | null>(null);
  const [scheduleAssignmentsMap, setScheduleAssignmentsMap] = useState<Map<string, ScheduleAssignment> | null>(null);
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
    setTermAssignmentsMap(new Map(assignments?.map(assignment => [assignment.term, assignment])));
    setScheduleAssignmentsMap(new Map(assignments?.map(assignment => [assignment.schedule_id, assignment])));
  }, [assignments]);

  const createAssignment: (
    scheduleId: string, 
    term: string
  ) => Promise<ScheduleAssignment | null> = useCallback(async (scheduleId, term) => {
    if (!assignments) {
      setError('Assignments was null.');
      return null;
    } else if (!data.profile || !data.profile.id) {
      setError('Couldn\'t find an ID for the user.');
      return null;
    }

    const prevAssignments = [...assignments];
    const tempAssignment: ScheduleAssignment = {
      user_id: data.profile.id,
      term: term,
      schedule_id: scheduleId,
      assigned_at: Date.now().toLocaleString(),
    };

    /** Optimistic update */
    setAssignments(prev => [...prev!, tempAssignment]);
    try {
      await createScheduleAssignment(data.profile.id, scheduleId, term);
      const newAssignments = await revalidate.refetchScheduleAssignments();

      const newAssignment = newAssignments?.find(assignment => 
        assignment.schedule_id === scheduleId && assignment.term === term
      )!;
      setAssignments(newAssignments);
      numUpdates.current += 1;

      return newAssignment;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return null;
  }, [assignments, revalidate, data.profile]);

  const updateAssignment: (
    newScheduleId: string,
    term: string,
  ) => Promise<ScheduleAssignment | null> = useCallback(async (newScheduleId, term) => {
    if (!assignments) {
      setError('Assignments was null.');
      return null;
    } else if (!data.profile || !data.profile.id) {
      setError('Couldn\'t find an ID for the user.');
      return null;
    }

    const prevAssignments = [...assignments];
    setAssignments(prev => (
      prev!.map(assignment => (
        assignment.term === term 
        ? { ...assignment, schedule_id: newScheduleId }
        : assignment
      ))
    ));

    try {
      await updateScheduleAssignment(data.profile.id, term, newScheduleId);
      const newAssignments = await revalidate.refetchScheduleAssignments();

      const updatedAssignment = newAssignments?.find(assignment => 
        assignment.term === term
      )!;
      setAssignments(newAssignments);
      numUpdates.current += 1;

      return updatedAssignment;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return null;
  }, [assignments, revalidate, data.profile]);

  const deleteAssignment: (
    userId: string,
    term: string,
  ) => Promise<boolean | null> = useCallback(async (userId, term) => {
    if (!assignments) {
      setError('Assignments was null.');
      return false;
    } else if (!data.profile || !data.profile.id) {
      setError('Couldn\'t find an ID for the user.');
      return null;
    }

    const prevAssignments = [...assignments];

    /** Optimistic update */
    setAssignments(prev => prev?.filter(assignment => assignment.term !== term) || []);
    try {
      await deleteScheduleAssignment(userId, term);
      await revalidate.refetchScheduleAssignments();

      numUpdates.current += 1;
      return true;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return false;
  }, [assignments, revalidate]);

  return {
    assignments,
    termAssignmentsMap,
    scheduleAssignmentsMap,
    handlers: {
      createAssignment,
      updateAssignment,
      deleteAssignment
    },
    error
  };
};