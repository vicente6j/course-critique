import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabaseProfile } from "../../contexts/server/profile/provider";
import { createScheduleGrade, deleteScheduleGrade, ScheduleGrade, updateScheduleGrade } from "../../api/schedule-grades";

export interface ExposedScheduleGradeHandlers {
  createGrade: (scheduleId: string, term: string, entryId: number, grade: string) => Promise<ScheduleGrade | null>;
  updateGrade: (scheduleId: string, term: string, entryId: number, grade: string) => Promise<ScheduleGrade | null>;
  deleteGrade: (scheduleId: string, term: string, entryId: number) => Promise<boolean | null>;
}

export interface UseScheduleGradeValues {
  grades: ScheduleGrade[] | null;
  gradeMap: Map<string, Map<string, ScheduleGrade[]>> | null;
  handlers: ExposedScheduleGradeHandlers;
  error: string | null;
}

export const useScheduleGrades = (): UseScheduleGradeValues => {

  const [grades, setGrades] = useState<ScheduleGrade[] | null>(null);
  const [gradeMap, setGradeMap] = useState<Map<string, Map<string, ScheduleGrade[]>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLoadComplete = useRef<boolean>(false);
  const numUpdates = useRef<number>(0);

  const {
    data,
    revalidate
  } = useDatabaseProfile();

  useEffect(() => {
    if (!initLoadComplete.current) {
      setGrades(data.scheduleGrades);
      initLoadComplete.current = true;
    }
  }, [data.scheduleGrades]);

  useEffect(() => {
    const map: Map<string, Map<string, ScheduleGrade[]>> = new Map();
    grades?.forEach(grade => {
      if (!map.has(grade.schedule_id)) {
        map.set(grade.schedule_id, new Map());
      }
      if (!map.get(grade.schedule_id)!.has(grade.term)) {
        map.get(grade.schedule_id)!.set(grade.term, []);
      }
      map.get(grade.schedule_id)!.get(grade.term)!.push(grade);
    })
    setGradeMap(map);
  }, [grades]);

  const createGrade: (
    scheduleId: string, 
    term: string,
    entryId: number,
    grade: string, 
  ) => Promise<ScheduleGrade | null> = useCallback(async (scheduleId, term, entryId, grade) => {
    if (!grades) {
      setError('Grades was null.');
      return null;
    }

    const prevGrades = [...grades];
    const tempGrade: ScheduleGrade = {
      schedule_id: scheduleId,
      term: term,
      entry_id: entryId,
      grade: grade,
      grade_updated_at: Date.now().toLocaleString(),
    };
    setGrades(prev => [...prev!, tempGrade]);

    try {
      await createScheduleGrade(scheduleId, term, entryId, grade);
      const newGrades = await revalidate.refetchScheduleGrades();
      setGrades(newGrades);

      const newGrade = newGrades?.find(grade => 
        grade.entry_id === entryId && grade.schedule_id === scheduleId && grade.term === term
      );
      numUpdates.current += 1;

      return newGrade!;
    } catch (e) {
      setError(e as string);
      setGrades(prevGrades);
      console.error(e);
    }
    return null;
  }, [grades, revalidate]);

  const updateGrade: (
    scheduleId: string, 
    term: string,
    entryId: number,
    grade: string, 
  ) => Promise<ScheduleGrade | null> = useCallback(async (scheduleId, term, entryId, grade) => {
    if (!grades) {
      setError('Grades was null.');
      return null;
    }

    const prevGrades = [...grades];
    setGrades(prev => (
      prev!.map(gradeEntry => 
        gradeEntry.schedule_id === scheduleId && gradeEntry.entry_id === entryId && gradeEntry.term === term 
          ? { ...gradeEntry, grade: grade }
          : gradeEntry
    )));

    try {
      await updateScheduleGrade(scheduleId, term, entryId, grade);
      const newGrades = await revalidate.refetchScheduleGrades();
      setGrades(newGrades);

      const updatedGrade = newGrades?.find(grade => 
        grade.entry_id === entryId && grade.schedule_id === scheduleId && grade.term === term
      );
      numUpdates.current += 1;

      return updatedGrade!;
    } catch (e) {
      setError(e as string);
      setGrades(prevGrades);
      console.error(e);
    }
    return null;
  }, [grades, revalidate]);

  const deleteGrade: (
    scheduleId: string,
    term: string,
    entryId: number,
  ) => Promise<boolean | null> = useCallback(async (scheduleId, term, entryId) => {
    if (!grades) {
      setError('Grades was null.');
      return false;
    }

    const prevGrades = [...grades];
    /** Optimistic update */
    setGrades(prev => 
      prev?.filter(grade => grade.entry_id !== entryId && grade.schedule_id !== scheduleId && grade.term !== term) 
      || []);

    try {
      await deleteScheduleGrade(scheduleId, term, entryId);
      await revalidate.refetchScheduleGrades();

      numUpdates.current += 1;
      return true;
    } catch (e) {
      setError(e as string);
      setGrades(prevGrades);
      console.error(e);
    }
    return false;
  }, [grades, revalidate]);

  return {
    grades,
    gradeMap,
    handlers: {
      createGrade,
      updateGrade,
      deleteGrade
    },
    error
  };
};