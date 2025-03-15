import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabaseProfile } from "../contexts/server/profile/provider";
import { createScheduleAssignment, deleteScheduleAssignment, ScheduleAssignment, updateScheduleAssignment } from "../api/schedule-assignments";
import { createScheduleEntry, deleteScheduleEntry, ScheduleEntry, updateScheduleEntry } from "../api/schedule-entries";

export interface ExposedScheduleEntryHandlers {
  createNewScheduleEntry: (scheduleId: string, courseId: string) => Promise<ScheduleEntry | null>;
  updateEntry: (scheduleId: string, entryId: number, newCourseId: string) => Promise<ScheduleEntry | null>;
  deleteEntry: (scheduleId: string, entryId: number) => Promise<boolean | null>;
}

export interface UseScheduleEntriesValue {
  data: {
    entries: ScheduleEntry[] | null;
  },
  maps: {
    entryMap: Map<string, ScheduleEntry[]> | null;
  }
  handlers: ExposedScheduleEntryHandlers;
  error: string | null;
}

export const useScheduleEntries = (): UseScheduleEntriesValue => {

  /** all schedule entries */
  const [entries, setEntries] = useState<ScheduleEntry[] | null>(null);

  /** schedule entries for each schedule (by ID) */
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
      map.get(entry.schedule_id)?.push(entry);
    });
    setEntryMap(map);
  }, [entries]);

  const createNewScheduleEntry: (
    scheduleId: string, 
    courseId: string
  ) => Promise<ScheduleEntry | null> = useCallback(async (scheduleId, courseId) => {
    if (!entries || !data.profile || !data.profile.id) {
      setError('One of entries or data (profile) was null.');
      return null;
    }

    const prevEntries = [...entries];
    const tempEntry: ScheduleEntry = {
      schedule_id: scheduleId,
      entry_id: -1, /** to indicate temporary nature of addition */
      course_id: courseId,
      name: null,
      created_at: null,
      updated_at: null,
      inserted_at: Date.now().toLocaleString(),
    };
    setEntries(prev => [...prev!, tempEntry]);

    try {
      await createScheduleEntry(scheduleId, courseId);
      const newEntries = await revalidate.refetchScheduleEntries();
      setEntries(newEntries);

      const newEntry = newEntries?.find(entry => entry.course_id === courseId && entry.schedule_id === scheduleId);
      numUpdates.current += 1;

      return newEntry!;
    } catch (e) {
      setError(e as string);
      setEntries(prevEntries);
      console.error(e);
    }
    return null;
  }, [entries, data.profile, revalidate]);

  const updateEntry: (
    scheduleId: string,
    entryId: number,
    newCourseId: string,
  ) => Promise<ScheduleEntry | null> = useCallback(async (scheduleId, entryId, newCourseId) => {
    if (!entries || !data.profile || !data.profile.id) {
      setError('One of entries or data (profile) was null.');
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

      numUpdates.current += 1;
      return updatedEntry!;
    } catch (e) {
      setError(e as string);
      setEntries(prevEntries);
      console.error(e);
    }
    return null;
  }, [entries, data.profile, revalidate]);

  const deleteEntry: (
    scheduleId: string,
    entryId: number,
  ) => Promise<boolean | null> = useCallback(async (scheduleId, entryId) => {
    if (!entries || !data.profile || !data.profile.id) {
      setError('One of entries or data (profile) was null.');
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
  }, [entries, data.profile, revalidate]);

  return {
    data: {
      entries,
    },
    maps: {
      entryMap
    },
    handlers: {
      createNewScheduleEntry,
      updateEntry,
      deleteEntry
    },
    error
  };
};