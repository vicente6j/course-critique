'use client'

import { courseScheduleFetch, ScheduleEntryData, ScheduleInfo } from "@/app/api/degree-plan";
import profileFetch, { ProfileResponse } from "@/app/api/profile";
import { createContext, FC, useCallback, useContext, useState } from "react";

export interface ProfileContextValue {
  profile: ProfileResponse | null;
  scheduleEntries: ScheduleEntryData[] | null;
  scheduleInfoData: ScheduleInfo[] | null;
  error: string | null;
  refetchProfile: () => Promise<void>;
  refetchScheduleEntries: () => Promise<void>;
}

export interface ProfileProviderProps {
  userProfile: ProfileResponse | null;
  scheduleEntryData: ScheduleEntryData[] | null;
  scheduleInfoData: ScheduleInfo[] | null;
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
  userProfile,
  scheduleEntryData,
  scheduleInfoData,
  children,
}: ProfileProviderProps) => {

  const [profile, setProfile] = useState<ProfileResponse | null>(userProfile);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntryData[] | null>(scheduleEntryData);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo[] | null>(scheduleInfoData);
  const [error, setError] = useState<string | null>(null);

  const refetchProfile: () => Promise<void> = useCallback(async () => {
    if (!profile) {
      setError('Couldn\'t refetch profile data');
      return;
    }
    try {
      const profileData = await profileFetch(profile!.email);
      setProfile(profileData);
    } catch (error) {
      setError('Failed to reload profile');
    }
  }, [profile]);

  const refetchScheduleEntries: () => Promise<void> = useCallback(async () => {
    if (!profile) {
      setError('Couldn\'t refetch schedule entry data.');
      return;
    }
    try {
      const newEntries = await courseScheduleFetch(profile!.id);
      setScheduleEntries(newEntries);
    } catch (error) {
      setError('Failed to reload entries');
    }
  }, [profile]);

  return (
    <ProfileContext.Provider 
      value={{ 
        profile: profile,
        scheduleEntries: scheduleEntries,
        scheduleInfoData: scheduleInfo,
        error: error,
        refetchProfile: refetchProfile,
        refetchScheduleEntries: refetchScheduleEntries,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = (): ProfileContextValue => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

export default ProfileProvider;