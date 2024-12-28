'use server'

import { FC } from "react";
import { DegreeProgram, DegreeProgramRequirement, fetchDegreeProgramRequirements, fetchDegreePrograms } from "@/app/api/degree-programs";
import DegreeProgramsProvider from "./provider";

export interface DegreeProgramsProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Again we call fetchDegreePrograms and fetchDegreeProgramRequirements on the server
 * to reduce load on the browser.
 * @param param0
 */
const DegreeProgramProviderWrapper: FC<DegreeProgramsProviderWrapperProps> = async ({
  children,
}: DegreeProgramsProviderWrapperProps) => {

  const degreePrograms: DegreeProgram[] = await fetchDegreePrograms();
  const degreeRequirements: DegreeProgramRequirement[] = await fetchDegreeProgramRequirements();

  return (
    <DegreeProgramsProvider
      degreePrograms={degreePrograms}
      degreeRequirements={degreeRequirements}
    >
      {children}
    </DegreeProgramsProvider>
  );
}

export default DegreeProgramProviderWrapper;