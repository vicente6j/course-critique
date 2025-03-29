import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabaseProfile } from "../../contexts/server/profile/provider";
import { createScheduleEntry, deleteScheduleEntry, ScheduleEntry, updateScheduleEntry } from "../../api/schedule-entries";

export interface ExposedScheduleEntryHandlers {
  createEntry: (scheduleId: string, courseId: string) => Promise<ScheduleEntry | null>;
  updateEntry: (scheduleId: string, entryId: number, newCourseId: string) => Promise<ScheduleEntry | null>;
  deleteEntry: (scheduleId: string, entryId: number) => Promise<boolean | null>;
}

export interface UseScheduleEntriesValue {
  entries: ScheduleEntry[] | null;
  entryMap: Map<string, ScheduleEntry[]> | null;
  handlers: ExposedScheduleEntryHandlers;
  error: string | null;
}

export const useScheduleEntries = (): UseScheduleEntriesValue => {

  const [entries, setEntries] = useState<ScheduleEntry[] | null>(null);
  const [entryMap, setEntryMap] = useState<Map<string, ScheduleEntry[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLoadComplete = useRef<boolean>(false);
  const numUpdates = useRef<number>(0);

  const {
    data,
    revalidate
  } = useDatabaseProfile();

  useEffect(() => {
    if (!initLoadComplete.current) {
      setEntries(data.scheduleEntries);
      initLoadComplete.current = true;
    }
  }, [data.scheduleEntries]);

  useEffect(() => {
    const map: Map<string, ScheduleEntry[]> = new Map();
    entries?.forEach(entry => {
      if (!map.has(entry.schedule_id)) {
        map.set(entry.schedule_id, []);
      }
      map.get(entry.schedule_id)!.push(entry);
    });
    setEntryMap(map);
  }, [entries]);

  const createEntry: (
    scheduleId: string, 
    courseId: string
  ) => Promise<ScheduleEntry | null> = useCallback(async (scheduleId, courseId) => {
    if (!entries) {
      setError('Entries was null.');
      return null;
    }

    const prevEntries = [...entries];
    const tempEntry: ScheduleEntry = {
      schedule_id: scheduleId,
      entry_id: -1, /** to indicate temporary nature of addition */
      course_id: courseId,
      inserted_at: Date.now().toLocaleString(),
      updated_at: Date.now().toLocaleString(),
    };
    setEntries(prev => [...prev!, tempEntry]);

    try {
      await createScheduleEntry(scheduleId, courseId);
      const newEntries = await revalidate.refetchScheduleEntries();
      setEntries(newEntries);

      /**
       * Just have to make sure that there are no duplicate courses.
       */
      const newEntry = newEntries?.find(entry => entry.course_id === courseId && entry.schedule_id === scheduleId);
      numUpdates.current += 1;

      return newEntry!;
    } catch (e) {
      setError(e as string);
      setEntries(prevEntries);
      console.error(e);
    }
    return null;
  }, [entries, revalidate]);

  const updateEntry: (
    scheduleId: string,
    entryId: number,
    newCourseId: string,
  ) => Promise<ScheduleEntry | null> = useCallback(async (scheduleId, entryId, newCourseId) => {
    if (!entries) {
      setError('Entries was null.');
      return null;
    }

    const prevEntries = [...entries];
    setEntries(prev => (
      prev!.map(entry => 
        entry.schedule_id === scheduleId && entry.entry_id === entryId  
          ? { ...entry, course_id: newCourseId }
          : entry
    )));

    try {
      await updateScheduleEntry(scheduleId, entryId, newCourseId);
      const newEntries = await revalidate.refetchScheduleEntries();
      const updatedEntry = newEntries?.find(entry => entry.entry_id === entryId && entry.schedule_id === scheduleId);
      setEntries(newEntries);

      numUpdates.current += 1;
      return updatedEntry!;
    } catch (e) {
      setError(e as string);
      setEntries(prevEntries);
      console.error(e);
    }
    return null;
  }, [entries, revalidate]);

  const deleteEntry: (
    scheduleId: string,
    entryId: number,
  ) => Promise<boolean | null> = useCallback(async (scheduleId, entryId) => {
    if (!entries) {
      setError('Entries was null.');
      return false;
    }

    const prevEntries = [...entries];
    /** Optimistic update */
    setEntries(prev => prev?.filter(entry => entry.entry_id !== entryId && entry.schedule_id !== scheduleId) || []);

    try {
      await deleteScheduleEntry(scheduleId, entryId);
      await revalidate.refetchScheduleEntries();

      numUpdates.current += 1;
      return true;
    } catch (e) {
      setError(e as string);
      setEntries(prevEntries);
      console.error(e);
    }
    return false;
  }, [entries, revalidate]);

  return {
    entries,
    entryMap,
    handlers: {
      createEntry,
      updateEntry,
      deleteEntry
    },
    error
  };
};