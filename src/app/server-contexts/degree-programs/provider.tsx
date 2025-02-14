'use client'

import { DegreeProgram, DegreeProgramRequirement } from "@/app/api/degree-programs";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface DegreeProgramContextValue {
  degreePrograms: DegreeProgram[] | null;
  degreeProgramMap: Map<string, DegreeProgram> | null;
  degreeRequirements: DegreeProgramRequirement[] | null;
  degreeRequirementsMap: Map<string, DegreeProgramRequirement[]> | null;
  loading: boolean | null;
}

export interface DegreeProgramProviderProps {
  degreePrograms: DegreeProgram[] | null;
  degreeRequirements: DegreeProgramRequirement[] | null;
  children: React.ReactNode;
}

export interface DegreeProgramProviderData {
  degreePrograms: DegreeProgram[];
  degreeRequirements: DegreeProgramRequirement[];
}

export interface DegreeProgramProviderMaps {
  degreePrograms: Map<string, DegreeProgram> | null;
  degreeRequirements:  Map<string, DegreeProgramRequirement[]> | null;
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

  const [data] = useState<DegreeProgramProviderData>({
    degreePrograms: degreePrograms!,
    degreeRequirements: degreeRequirements!,
  });
  const [maps, setMaps] = useState<DegreeProgramProviderMaps>({
    degreePrograms: new Map(),
    degreeRequirements: new Map(),
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {
    const degreeProgramsMap = new Map(data.degreePrograms.map(program => [program.id, program]));

    const degreeRequirementsMap = new Map();
    data.degreeRequirements?.forEach(requirement => {
      if (!degreeRequirementsMap.has(requirement.program_id)) {
        degreeRequirementsMap.set(requirement.program_id, []);
      }
      degreeRequirementsMap.get(requirement.program_id).push(requirement);
    });

    setMaps({
      degreePrograms: degreeProgramsMap,
      degreeRequirements: degreeRequirementsMap,
    });
    setLoading(false);
  }, [data]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

    /**
   * Memoize the context value such that there are no unncessary rerenders
   * upon a child component calling an instance of the context.
   */
    const contextValue: DegreeProgramContextValue = useMemo(() => ({
      degreePrograms: data.degreePrograms,
      degreeProgramMap: maps.degreePrograms,
      degreeRequirements: data.degreeRequirements,
      degreeRequirementsMap: maps.degreeRequirements,
      loading: loading,
    }), [data, maps, loading]);

  return (
    <DegreeProgramContext.Provider value={contextValue}>
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