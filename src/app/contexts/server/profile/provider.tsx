'use client'

import { fetchProfile, ProfileResponse } from "@/app/api/profile";
import { fetchSchedules, ScheduleInfo } from "@/app/api/schedule";
import { fetchAssignments, ScheduleAssignment } from "@/app/api/schedule-assignments";
import { fetchScheduleEntries, ScheduleEntry } from "@/app/api/schedule-entries";
import { fetchGrades, ScheduleGrade } from "@/app/api/schedule-grades";
import { fetchTermSelections, TermSelection } from "@/app/api/term-selections";
import { createContext, FC, useCallback, useContext, useEffect, useState } from "react";

export interface DatabaseProfileProviderProps {
  profile: ProfileResponse | null;
  schedules: ScheduleInfo[] | null;
  scheduleEntries: ScheduleEntry[] | null;
  scheduleAssignments: ScheduleAssignment[] | null;
  scheduleGrades: ScheduleGrade[] | null;
  termSelections: TermSelection[] | null;
  children: React.ReactNode;
}

export interface DatabaseProfileContextValue {
  data: DatabaseProfileProviderData;
  maps: DatabaseProfileProviderMaps;
  revalidate: DatabaseProfileProviderRevalidate;
  error: string | null;
  loading: boolean | null;
}

export interface DatabaseProfileProviderData {
  profile: ProfileResponse | null;
  schedules: ScheduleInfo[] | null;
  scheduleEntries: ScheduleEntry[] | null;
  scheduleAssignments: ScheduleAssignment[] | null;
  scheduleGrades: ScheduleGrade[] | null;
  termSelections: TermSelection[] | null;
}

export interface DatabaseProfileProviderMaps {
  schedules: Map<string, ScheduleInfo> | null;
  scheduleEntries: Map<string, ScheduleEntry[]> | null;
  scheduleAssignments: Map<string, ScheduleAssignment> | null;
  scheduleGrades: Map<string, ScheduleGrade[]> | null;
  termSelections: Map<string, TermSelection> | null;
}

export interface DatabaseProfileProviderRevalidate {
  refetchProfile: () => Promise<ProfileResponse | null>;
  refetchSchedules: () => Promise<ScheduleInfo[] | null>;
  refetchScheduleEntries: () => Promise<ScheduleEntry[] | null>;
  refetchScheduleAssignments: () => Promise<ScheduleAssignment[] | null>;
  refetchScheduleGrades: () => Promise<ScheduleGrade[] | null>;
  refetchTermSelections: () => Promise<TermSelection[] | null>;
}

const DatabaseProfileContext = createContext<DatabaseProfileContextValue | undefined>(undefined);

/**
 * The purpose of this provider is to fetch not only the profile data
 * of the user (e.g. name, auth provider, major), but also
 * the schedules belonging to this user so that we can utilize it
 * in every part of the client.
 * @param param0 
 */
const DatabaseProfileProvider: FC<DatabaseProfileProviderProps> = ({
  profile: initialProfile,
  schedules: initialSchedules,
  scheduleEntries: initialScheduleEntries,
  scheduleAssignments: initialScheduleAssignments,
  scheduleGrades: initialScheduleGrades,
  termSelections: initialTermSelections,
  children,
}: DatabaseProfileProviderProps) => {

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [data, setData] = useState<DatabaseProfileProviderData>({
    profile: initialProfile,
    schedules: initialSchedules,
    scheduleEntries: initialScheduleEntries,
    scheduleAssignments: initialScheduleAssignments,
    scheduleGrades: initialScheduleGrades,
    termSelections: initialTermSelections,
  });

  const [maps, setMaps] = useState<DatabaseProfileProviderMaps>({
    schedules: new Map(),
    scheduleEntries: new Map(),
    scheduleAssignments: new Map(),
    scheduleGrades: new Map(),
    termSelections: new Map(),
  });

  const constructMaps: () => void = useCallback(() => {
    const scheduleMap = new Map(data.schedules?.map(schedule => [schedule.schedule_id, schedule]));

    const scheduleEntryMap = new Map();
    data.scheduleEntries?.forEach(entry => {
      if (!scheduleEntryMap.has(entry.schedule_id)) {
        scheduleEntryMap.set(entry.schedule_id, []);
      }
      scheduleEntryMap.get(entry.schedule_id).push(entry);
    });
    
    const scheduleGradeMap = new Map();
    data.scheduleGrades?.forEach(grade => {
      if (!scheduleGradeMap.has(grade.schedule_id)) {
        scheduleGradeMap.set(grade.schedule_id, []);
      }
      scheduleGradeMap.get(grade.schedule_id).push(grade);
    });

    const scheduleAssignmentsMap = new Map(data.scheduleAssignments?.map(assignment => [assignment.term, assignment]));
    const termSelectionsMap = new Map(data.termSelections?.map(term => [term.term, term]));

    setMaps({
      schedules: scheduleMap,
      scheduleEntries: scheduleEntryMap,
      scheduleAssignments: scheduleAssignmentsMap,
      scheduleGrades: scheduleGradeMap,
      termSelections: termSelectionsMap,
    });
    setLoading(false);
  }, [data]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  const refetchProfile: () => Promise<ProfileResponse | null> = useCallback(async () => {
    if (!data.profile?.email) {
      setError('No email found.');
      return null;
    }
    let newProfile: ProfileResponse | null = null;
    try {
      newProfile = await fetchProfile(data.profile.email);
      setData(prev => ({
        ...prev,
        profile: newProfile,
      }));
    } catch (error) {
      setError('Failed to reload profile.');
      return null;
    }
    return newProfile;
  }, [data.profile]);

  const refetchSchedules: () => Promise<ScheduleInfo[] | null> = useCallback(async () => {
    if (!data.profile?.id) {
      setError('No user ID found.');
      return null;
    }
    let newSchedules: ScheduleInfo[] = [];
    try {
      newSchedules = await fetchSchedules(data.profile.id);
      setData(prevData => ({
        ...prevData,
        schedules: newSchedules,
      }));
      setMaps(prevMaps => ({
        ...prevMaps,
        schedules: new Map(newSchedules.map(schedule => [schedule.schedule_id, schedule]))
      }));
    } catch (error) {
      setError('Failed to reload schedules.');
      return null;
    }
    return newSchedules;
  }, [data.profile]);

  const refetchScheduleEntries: () => Promise<ScheduleEntry[] | null> = useCallback(async () => {
    if (!data.profile?.id) {
      setError('No user ID found.');
      return null;
    }
    let newEntries: ScheduleEntry[] = [];
    try {
      newEntries = await fetchScheduleEntries(data.profile.id);
      setData(prevData => ({
        ...prevData,
        scheduleEntries: newEntries,
      }));
      
      const newEntryMap = new Map();
      newEntries?.forEach(entry => {
        if (!newEntryMap.has(entry.schedule_id)) {
          newEntryMap.set(entry.schedule_id, []);
        }
        newEntryMap.get(entry.schedule_id).push(entry);
      });
      setMaps(prevMaps => ({
        ...prevMaps,
        scheduleEntries: newEntryMap,
      }));
    } catch (error) {
      setError('Failed to reload schedule entries.');
      return null;
    }
    return newEntries;
  }, [data.profile]);

  const refetchScheduleAssignments: () => Promise<ScheduleAssignment[] | null> = useCallback(async () => {
    if (!data.profile?.id) {
      setError('No user ID found.');
      return null;
    }
    let newAssignments: ScheduleAssignment[] = [];
    try {
      newAssignments = await fetchAssignments(data.profile.id);
      setData(prevData => ({
        ...prevData,
        scheduleAssignments: newAssignments,
      }));
      setMaps(prevMaps => ({
        ...prevMaps,
        scheduleAssignments: new Map(newAssignments?.map(assignment => [assignment.schedule_id, assignment]))
      }));
    } catch (error) {
      setError('Failed to reload schedule assignments.');
      return null;
    }
    return newAssignments;
  }, [data.profile]);

  const refetchScheduleGrades: () => Promise<ScheduleGrade[] | null> = useCallback(async () => {
    if (!data.profile?.id) {
      setError('No user ID found.');
      return null;
    }
    let newGrades: ScheduleGrade[] = [];
    try {
      newGrades = await fetchGrades(data.profile.id);
      setData(prevData => ({
        ...prevData,
        scheduleGrades: newGrades,
      }));
      const newGradeMap = new Map();
      newGrades?.forEach(grade => {
        if (!newGradeMap.has(grade.schedule_id)) {
          newGradeMap.set(grade.schedule_id, []);
        }
        newGradeMap.get(grade.schedule_id).push(grade);
      });
      setMaps(prevMaps => ({
        ...prevMaps,
        scheduleGrades: newGradeMap,
      }));
    } catch (error) {
      setError('Failed to reload schedule grades.');
      return null;
    }
    return newGrades;
  }, [data.profile]);

  const refetchTermSelections: () => Promise<TermSelection[] | null> = useCallback(async () => {
    if (!data.profile?.id) {
      setError('No user ID found.');
      return null;
    }
    let newSelections: TermSelection[] = [];
    try {
      newSelections = await fetchTermSelections(data.profile.id);
      setData(prevData => ({
        ...prevData,
        termSelections: newSelections,
      }));
      setMaps(prevMaps => ({
        ...prevMaps,
        termSelections: new Map(newSelections.map(selection => [selection.term, selection]))
      }));
    } catch (error) {
      setError('Failed to reload term selections.');
      return null;
    }
    return newSelections;
  }, [data.profile]);

  return (
    <DatabaseProfileContext.Provider 
      value={{ 
        data: data,
        maps: maps,
        error: error,
        loading: loading,
        revalidate: {
          refetchProfile,
          refetchSchedules,
          refetchScheduleEntries,
          refetchScheduleAssignments,
          refetchScheduleGrades,
          refetchTermSelections
        }
      }}
    >
      {children}
    </DatabaseProfileContext.Provider>
  );
}

export const useDatabaseProfile = (): DatabaseProfileContextValue => {
  const context: DatabaseProfileContextValue | undefined = useContext(DatabaseProfileContext);
  if (context === undefined) {
    throw new Error('useDatabseProfile must be used within a DatabaseProfileProvider');
  }
  return context;
}

export default DatabaseProfileProvider;