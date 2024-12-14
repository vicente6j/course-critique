'use server'

import { FC } from "react";
import { DegreeProgram, DegreeProgramRequirement, fetchDegreeProgramRequirements, fetchDegreePrograms } from "@/app/api/degree-programs";
import DegreeProgramsProvider from "./provider";

export interface DegreeProgramsProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Obviously in order to even use this wrapper we need the email associated with the current
 * session. It would probably be best to obtain this on the server, but it likely 
 * doesn't matter.
 * @param param0 
 * @returns 
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