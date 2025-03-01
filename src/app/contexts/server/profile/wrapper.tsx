'use server'

import { FC } from "react";
import DatabaseProfileProvider from "./provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authConfig";
import { fetchProfile, ProfileResponse } from "@/app/api/profile";
import { fetchScheduleEntries, ScheduleEntry } from "@/app/api/schedule-entries";
import { fetchSchedules, ScheduleInfo } from "@/app/api/schedule";
import { fetchAssignments, ScheduleAssignment } from "@/app/api/schedule-assignments";
import { fetchGrades, ScheduleGrade } from "@/app/api/schedule-grades";
import { fetchTermSelections, TermSelection } from "@/app/api/term-selections";

export interface DatabaseProfileProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Obviously in order to even use this wrapper we need the email associated with the current
 * session. It would probably be best to obtain this on the server, but it likely 
 * doesn't matter.
 * @param param0 
 * @returns Children of wrapper.
 */
const DatabaseProfileProviderWrapper: FC<DatabaseProfileProviderWrapperProps> = async ({
  children,
}: DatabaseProfileProviderWrapperProps) => {

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <>
        {children}
      </>
    );
  }

  const profile: ProfileResponse = await fetchProfile(session.user.email);
  const schedules: ScheduleInfo[] = await fetchSchedules(profile.id);
  const scheduleEntries: ScheduleEntry[] = await fetchScheduleEntries(profile.id);
  const scheduleAssignments: ScheduleAssignment[] = await fetchAssignments(profile.id);
  const scheduleGrades: ScheduleGrade[] = await fetchGrades(profile.id);
  const termSelections: TermSelection[] = await fetchTermSelections(profile.id);

  return (
    <DatabaseProfileProvider
      profile={profile}
      schedules={schedules}
      scheduleEntries={scheduleEntries}
      scheduleAssignments={scheduleAssignments}
      scheduleGrades={scheduleGrades}
      termSelections={termSelections}
    >
      {children}
    </DatabaseProfileProvider>
  );
}

export default DatabaseProfileProviderWrapper;