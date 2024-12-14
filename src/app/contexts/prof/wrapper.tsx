'use server'

import { FC } from "react"
import ProfProvider from "./provider";
import { AllProfResponse, fetchProfAverages, fetchProfAveragesByCourse, fetchProfAveragesByTerm, fetchProfHotCourses, fetchProfInfo, HotResponse, ProfAverages, ProfAveragesByCourse, ProfAveragesByTerm } from "@/app/api/prof";

export interface ProfProviderWrapperProps {
  children: React.ReactNode;
}

const ProfProviderWrapper: FC<ProfProviderWrapperProps> = async ({
  children
}: ProfProviderWrapperProps) => {

  const profAveragesPure: ProfAverages[] = await fetchProfAverages();
  const profAveragesByCourse: ProfAveragesByCourse[] = await fetchProfAveragesByCourse();
  const profAveragesByTerm: ProfAveragesByTerm[] = await fetchProfAveragesByTerm();
  const profInfo: AllProfResponse = await fetchProfInfo();
  const hotCourses: HotResponse[] = await fetchProfHotCourses();

  return (
    <ProfProvider
      profAveragesPure={profAveragesPure}
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