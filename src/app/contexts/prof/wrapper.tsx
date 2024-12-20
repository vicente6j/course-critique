'use server'

import { FC } from "react"
import ProfProvider from "./provider";
import { AllProfResponse, fetchProfData, fetchProfHotCourses, fetchProfInfo, HotResponse, ProfAverages, ProfAveragesByCourse, ProfAveragesByTerm } from "@/app/api/prof";

export interface ProfProviderWrapperProps {
  children: React.ReactNode;
}

const ProfProviderWrapper: FC<ProfProviderWrapperProps> = async ({
  children
}: ProfProviderWrapperProps) => {

  const profAverages: ProfAverages[] = await fetchProfData('averages');
  const profAveragesByCourse: ProfAveragesByCourse[] = await fetchProfData('byCourse');
  const profAveragesByTerm: ProfAveragesByTerm[] = await fetchProfData('byTerm');
  const profInfo: AllProfResponse = await fetchProfInfo();
  const hotCourses: HotResponse[] = await fetchProfHotCourses();

  return (
    <ProfProvider
      profAverages={profAverages}
      profAveragesByCourse={profAveragesByCourse}
      profAveragesByTerm={profAveragesByTerm}
      profInfo={profInfo.profs}
      hotCourses={hotCourses}
    >
      {children}
    </ProfProvider>
  );
}

export default ProfProviderWrapper;