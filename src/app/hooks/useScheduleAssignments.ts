import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabaseProfile } from "../contexts/server/profile/provider";
import { createScheduleAssignment, deleteScheduleAssignment, ScheduleAssignment } from "../api/schedule-assignments";

export interface ExposedScheduleAssignmentHandlers {
  createAssignment: (scheduleId: string, term: string) => Promise<ScheduleAssignment | null>;
  deleteAssignment: (scheduleId: string, term: string) => Promise<boolean | null>;
}

export interface UseScheduleAssignmentsValue {
  assignments: ScheduleAssignment[] | null;
  assignmentsMap: Map<string, ScheduleAssignment> | null;
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

  const createAssignment: (
    scheduleId: string, 
    term: string
  ) => Promise<ScheduleAssignment | null> = useCallback(async (scheduleId, term) => {
    if (!assignments) {
      setError('Assignments was null.');
      return null;
    }

    const prevAssignments = [...assignments];
    const newAssignment: ScheduleAssignment = {
      term: term,
      schedule_id: scheduleId,
      assigned_at: Date.now().toLocaleString(),
    };

    /** Optimistic update */
    setAssignments(prev => [...prev!, newAssignment]);
    try {
      await createScheduleAssignment(scheduleId, term);
      const newAssignments = await revalidate.refetchScheduleAssignments();

      const res = newAssignments?.find(assignment => 
        assignment.schedule_id === scheduleId && assignment.term === term
      )!;
      setAssignments(newAssignments);
      numUpdates.current += 1;

      return res;
    } catch (e) {
      setError(e as string);
      setAssignments(prevAssignments);
      console.error(e);
    }
    return null;
  }, [assignments, revalidate]);

  const deleteAssignment: (
    scheduleId: string,
    term: string,
  ) => Promise<boolean | null> = useCallback(async (scheduleId, term) => {
    if (!assignments) {
      setError('Assignments was null.');
      return false;
    }

    const prevAssignments = [...assignments];

    /** Optimistic update */
    setAssignments(prev => prev?.filter(assignment => assignment.term !== term) || []);
    try {
      await deleteScheduleAssignment(scheduleId, term);
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
    assignmentsMap,
    handlers: {
      createAssignment,
      deleteAssignment
    },
    error
  };
};