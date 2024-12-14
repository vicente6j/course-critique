'use client'

import { ScheduleEntryData, ScheduleInfo } from "@/app/api/degree-plan";
import { DegreeProgram, DegreeProgramRequirement } from "@/app/api/degree-programs";
import profileFetch, { ProfileResponse } from "@/app/api/profile";
import { createContext, FC, useCallback, useContext, useState } from "react";

export interface DegreeProgramContextValue {
  degreePrograms: DegreeProgram[] | null;
  degreeProgramMap: Map<string, DegreeProgram> | null;
  degreeRequirements: DegreeProgramRequirement[] | null;
}

export interface DegreeProgramProviderProps {
  degreePrograms: DegreeProgram[] | null;
  degreeRequirements: DegreeProgramRequirement[] | null;
  children: React.ReactNode;
}

const DegreeProgramContext = createContext<DegreeProgramContextValue | undefined>(undefined);

/**
 * The purpose of this provider is, similar to the other providers in this
 * directory, to allow for easy access to everything related to degree
 * programs.
 * @param param0 
 */
const DegreeProgramsProvider: FC<DegreeProgramProviderProps> = ({
  degreePrograms,
  degreeRequirements,
  children,
}: DegreeProgramProviderProps) => {

  const [programs, setDegreePrograms] = useState<DegreeProgram[] | null>(degreePrograms);
  const [programsMap, setProgramsMap] = useState<Map<string, DegreeProgram> | null>(new Map(programs!.map(program => [program.id, program])));
  const [requirements, setRequirements] = useState<DegreeProgramRequirement[] | null>(degreeRequirements);

  return (
    <DegreeProgramContext.Provider 
      value={{ 
        degreePrograms: programs,
        degreeRequirements: requirements,
        degreeProgramMap: programsMap,
      }}
    >
      {children}
    </DegreeProgramContext.Provider>
  );
}

export const useDegreePrograms = (): DegreeProgramContextValue => {
  const context = useContext(DegreeProgramContext);
  if (context === undefined) {
    throw new Error('useDegreePrograms must be used within a DegreeProgramProvider');
  }
  return context;
}

export default DegreeProgramsProvider;