'use client'

import { fetchProfile, ProfileResponse } from "@/app/api/profile";
import { fetchSchedules, ScheduleInfo } from "@/app/api/schedule";
import { fetchAssignments, ScheduleAssignment } from "@/app/api/schedule-assignments";
import { fetchScheduleEntries, ScheduleEntry } from "@/app/api/schedule-entries";
import { fetchGrades, ScheduleGrade } from "@/app/api/schedule-grades";
import { fetchTermSelections, TermSelection } from "@/app/api/term-selections";
import { createContext, FC, useCallback, useContext, useEffect, useState } from "react";

export interface ProfileContextValue {
  profile: ProfileResponse | null;
  schedules: ScheduleInfo[] | null;
  scheduleMap: Map<string, ScheduleInfo> | null;
  scheduleEntries: ScheduleEntry[] | null;
  scheduleEntryMap: Map<string, ScheduleEntry[]> | null;
  scheduleAssignments: ScheduleAssignment[] | null;
  scheduleAssignmentsMap: Map<string, ScheduleAssignment> | null;
  scheduleGrades: ScheduleGrade[] | null;
  termSelections: TermSelection[] | null;
  termSelectionsMap: Map<string, TermSelection> | null;
  error: string | null;
  refetchProfile: () => Promise<boolean>;
  refetchSchedules: () => Promise<boolean>;
  refetchScheduleEntries: () => Promise<boolean>;
  refetchScheduleAssignments: () => Promise<boolean>;
  refetchScheduleGrades: () => Promise<boolean>;
  refetchTermSelections: () => Promise<boolean>;
}

export interface ProfileProviderProps {
  profile: ProfileResponse | null;
  schedules: ScheduleInfo[] | null;
  scheduleEntries: ScheduleEntry[] | null;
  scheduleAssignments: ScheduleAssignment[] | null;
  scheduleGrades: ScheduleGrade[] | null;
  termSelections: TermSelection[] | null;
  children: React.ReactNode;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * The purpose of this provider is to fetch not only the profile data
 * of the user (e.g. name, auth provider, major), but also
 * the schedules belonging to this user so that we can utilize it
 * in every part of the client.
 * @param param0 
 */
const ProfileProvider: FC<ProfileProviderProps> = ({
  profile: initialProfile,
  schedules: initialSchedules,
  scheduleEntries: initialScheduleEntries,
  scheduleAssignments: initialScheduleAssignments,
  scheduleGrades: initialScheduleGrades,
  termSelections: initialTermSelections,
  children,
}: ProfileProviderProps) => {

  const [profile, setProfile] = useState<ProfileResponse | null>(initialProfile);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<{
    schedules: ScheduleInfo[];
    scheduleEntries: ScheduleEntry[];
    scheduleAssignments: ScheduleAssignment[];
    scheduleGrades: ScheduleGrade[];
    termSelections: TermSelection[];
  }>({
    schedules: initialSchedules!,
    scheduleEntries: initialScheduleEntries!,
    scheduleAssignments: initialScheduleAssignments!,
    scheduleGrades: initialScheduleGrades!,
    termSelections: initialTermSelections!,
  });

  const [maps, setMaps] = useState<{
    scheduleInfoMap: Map<string, ScheduleInfo>;
    scheduleEntryMap: Map<string, ScheduleEntry[]>;
    scheduleAssignments: Map<string, ScheduleAssignment>;
    termSelections: Map<string, TermSelection>;
  }>({
    scheduleInfoMap: new Map(),
    scheduleEntryMap: new Map(),
    scheduleAssignments: new Map(),
    termSelections: new Map(),
  });

  const constructMaps: () => void = useCallback(() => {
    const scheduleInfoMap = new Map(data.schedules?.map(schedule => [schedule.schedule_id, schedule]));

    const scheduleEntryMap = new Map();
    data.scheduleEntries?.forEach(entry => {
      const existing = scheduleEntryMap.get(entry.schedule_id) || [];
      scheduleEntryMap.set(entry.schedule_id, [...existing, entry]);
    });

    const scheduleAssignmentsMap = new Map(data.scheduleAssignments?.map(assignment => [assignment.term, assignment]));
    const termSelectionsMap = new Map(data.termSelections?.map(term => [term.term, term]));

    setMaps({
      scheduleInfoMap: scheduleInfoMap,
      scheduleEntryMap: scheduleEntryMap,
      scheduleAssignments: scheduleAssignmentsMap,
      termSelections: termSelectionsMap,
    });
  }, [data]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  const refetchProfile: () => Promise<boolean> = useCallback(async () => {
    if (!profile?.email) {
      setError('No email found.');
      return false;
    }
    try {
      const newProfile = await fetchProfile(profile.email);
      setProfile(newProfile);
    } catch (error) {
      setError('Failed to reload profile.');
      return false;
    }
    return true;
  }, [profile]);

  const refetchSchedules: () => Promise<boolean> = useCallback(async () => {
    if (!profile?.id) {
      setError('No user ID found.');
      return false;
    }
    try {
      const newSchedules = await fetchSchedules(profile.id);
      setData(prevData => ({
        ...prevData,
        schedules: newSchedules,
      }));
    } catch (error) {
      setError('Failed to reload schedules.');
      return false;
    }
    return true;
  }, [profile]);

  const refetchScheduleEntries: () => Promise<boolean> = useCallback(async () => {
    if (!profile?.id) {
      setError('No user ID found.');
      return false;
    }
    try {
      const newEntries = await fetchScheduleEntries(profile.id);
      setData(prevData => ({
        ...prevData,
        scheduleEntries: newEntries,
      }));
    } catch (error) {
      setError('Failed to reload schedule entries.');
      return false;
    }
    return true;
  }, [profile]);

  const refetchScheduleAssignments: () => Promise<boolean> = useCallback(async () => {
    if (!profile?.id) {
      setError('No user ID found.');
      return false;
    }
    try {
      const newAssignments = await fetchAssignments(profile.id);
      setData(prevData => ({
        ...prevData,
        scheduleAssignments: newAssignments,
      }));
    } catch (error) {
      setError('Failed to reload schedule assignments.');
      return false;
    }
    return true;
  }, [profile]);

  const refetchScheduleGrades: () => Promise<boolean> = useCallback(async () => {
    if (!profile?.id) {
      setError('No user ID found.');
      return false;
    }
    try {
      const newGrades = await fetchGrades(profile.id);
      setData(prevData => ({
        ...prevData,
        scheduleGrades: newGrades,
      }));
    } catch (error) {
      setError('Failed to reload schedule grades.');
      return false;
    }
    return true;
  }, [profile]);

  const refetchTermSelections: () => Promise<boolean> = useCallback(async () => {
    if (!profile?.id) {
      setError('No user ID found.');
      return false;
    }
    try {
      const newSelections = await fetchTermSelections(profile.id);
      setData(prevData => ({
        ...prevData,
        termSelections: newSelections,
      }));
    } catch (error) {
      setError('Failed to reload term selections.');
      return false;
    }
    return true;
  }, [profile]);

  return (
    <ProfileContext.Provider 
      value={{ 
        profile: profile,
        schedules: data.schedules,
        scheduleMap: maps.scheduleInfoMap,
        scheduleEntries: data.scheduleEntries,
        scheduleEntryMap: maps.scheduleEntryMap,
        scheduleAssignments: data.scheduleAssignments,
        scheduleAssignmentsMap: maps.scheduleAssignments,
        scheduleGrades: data.scheduleGrades,
        termSelections: data.termSelections,
        termSelectionsMap: maps.termSelections,
        error: error,
        refetchProfile: refetchProfile,
        refetchSchedules: refetchSchedules,
        refetchScheduleEntries: refetchScheduleEntries,
        refetchScheduleAssignments: refetchScheduleAssignments,
        refetchScheduleGrades: refetchScheduleGrades,
        refetchTermSelections: refetchTermSelections
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = (): ProfileContextValue => {
  const context: ProfileContextValue | undefined = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

export default ProfileProvider;