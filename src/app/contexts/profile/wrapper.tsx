'use server'

import { courseScheduleFetch, ScheduleEntryData, ScheduleInfo, scheduleInfoFetch } from "@/app/api/degree-plan";
import profileFetch, { ProfileResponse } from "@/app/api/profile";
import { FC } from "react";
import ProfileProvider from "./provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authConfig";

export interface ProfileProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Obviously in order to even use this wrapper we need the email associated with the current
 * session. It would probably be best to obtain this on the server, but it likely 
 * doesn't matter.
 * @param param0 
 * @returns 
 */
const ProfileProviderWrapper: FC<ProfileProviderWrapperProps> = async ({
  children,
}: ProfileProviderWrapperProps) => {

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <>
        {children}
      </>
    );
  }

  const profile: ProfileResponse = await profileFetch(session.user.email);
  const scheduleEntryData: ScheduleEntryData[] = await courseScheduleFetch(profile.id);
  const scheduleInfoData: ScheduleInfo[] = await scheduleInfoFetch(profile.id);

  return (
    <ProfileProvider
      userProfile={profile}
      scheduleEntryData={scheduleEntryData}
      scheduleInfoData={scheduleInfoData}
    >
      {children}
    </ProfileProvider>
  );
}

export default ProfileProviderWrapper;