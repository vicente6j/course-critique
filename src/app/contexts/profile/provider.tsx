'use client'

import { fetchProfile, ProfileResponse } from "@/app/api/profile";
import { fetchSchedules, ScheduleInfo } from "@/app/api/schedule";
import { fetchAssignments, ScheduleAssignment } from "@/app/api/schedule-assignments";
import { fetchScheduleEntries, ScheduleEntry } from "@/app/api/schedule-entries";
import { fetchGrades, ScheduleGrade } from "@/app/api/schedule-grades";
import { fetchTermSelections, TermSelection } from "@/app/api/term-selections";
import { createContext, FC, useCallback, useContext, useState } from "react";

export interface ProfileContextValue {
  profile: ProfileResponse | null;
  schedules: ScheduleInfo[] | null;
  scheduleEntries: ScheduleEntry[] | null;
  scheduleAssignments: ScheduleAssignment[] | null;
  scheduleGrades: ScheduleGrade[] | null;
  termSelections: TermSelection[] | null;
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
  const [schedules, setSchedules] = useState<ScheduleInfo[] | null>(initialSchedules);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[] | null>(initialScheduleEntries);
  const [scheduleAssignments, setScheduleAssignments] = useState<ScheduleAssignment[] | null>(initialScheduleAssignments);
  const [scheduleGrades, setScheduleGrades] = useState<ScheduleGrade[] | null>(initialScheduleGrades);
  const [termSelections, setTermSelections] = useState<TermSelection[] | null>(initialTermSelections);
  const [error, setError] = useState<string | null>(null);

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
      setSchedules(newSchedules);
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
      setScheduleEntries(newEntries);
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
      setScheduleAssignments(newAssignments);
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
      setScheduleGrades(newGrades);
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
      setTermSelections(newSelections);
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
        schedules: schedules,
        scheduleEntries: scheduleEntries,
        scheduleAssignments: scheduleAssignments,
        scheduleGrades: scheduleGrades,
        termSelections: termSelections,
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