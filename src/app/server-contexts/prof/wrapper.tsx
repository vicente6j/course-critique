'use server'

import { FC } from "react"
import ProfProvider from "./provider";
import { CourseAveragesByProf, CoursesTaughtByTerm, fetchCourseAveragesByProf, fetchCoursesTaughtByTerm, fetchProfAverages, fetchProfAveragesByTerm, fetchProfInfo, ProfAverages, ProfAveragesByTerm, ProfInfo } from "@/app/api/prof";

export interface ProfProviderWrapperProps {
  children: React.ReactNode;
}

const ProfProviderWrapper: FC<ProfProviderWrapperProps> = async ({
  children
}: ProfProviderWrapperProps) => {

  const profAverages: ProfAverages[] = await fetchProfAverages();
  const courseAveragesByProf: CourseAveragesByProf[] = await fetchCourseAveragesByProf();
  const profAveragesByTerm: ProfAveragesByTerm[] = await fetchProfAveragesByTerm();
  const profInfo: ProfInfo[] = await fetchProfInfo();
  const coursesTaughtByTerm: CoursesTaughtByTerm[] = await fetchCoursesTaughtByTerm();

  return (
    <ProfProvider
      profAverages={profAverages}
      courseAveragesByProf={courseAveragesByProf}
      profAveragesByTerm={profAveragesByTerm}
      profInfo={profInfo}
      coursesTaughtByTerm={coursesTaughtByTerm}
    >
      {children}
    </ProfProvider>
  );
}

export default ProfProviderWrapper;