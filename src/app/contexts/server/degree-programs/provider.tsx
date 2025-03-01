'use client'

import { DegreeProgram, DegreeProgramRequirement, DegreeProgramAveragesByTerm } from "@/app/api/degree-programs";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface DegreeProgramContextValue {
  data: DegreeProgramProviderData;
  maps: DegreeProgramProviderMaps;
  loading: boolean | null;
}

export interface DegreeProgramProviderProps {
  degreePrograms: DegreeProgram[] | null;
  degreeRequirements: DegreeProgramRequirement[] | null;
  programAveragesByTerm: DegreeProgramAveragesByTerm[];
  children: React.ReactNode;
}

export interface DegreeProgramProviderData {
  degreePrograms: DegreeProgram[];
  degreeRequirements: DegreeProgramRequirement[];
  programAveragesByTerm: DegreeProgramAveragesByTerm[];
}

export interface DegreeProgramProviderMaps {
  degreePrograms: Map<string, DegreeProgram> | null;
  degreeRequirements:  Map<string, DegreeProgramRequirement[]> | null;
  programToTermAveragesMap: Map<string, DegreeProgramAveragesByTerm[]> | null;
  termToProgramAveragesMap: Map<string, DegreeProgramAveragesByTerm[]> | null;
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
  programAveragesByTerm,
  children,
}: DegreeProgramProviderProps) => {

  const [data] = useState<DegreeProgramProviderData>({
    degreePrograms: degreePrograms!,
    degreeRequirements: degreeRequirements!,
    programAveragesByTerm: programAveragesByTerm,
  });
  const [maps, setMaps] = useState<DegreeProgramProviderMaps>({
    degreePrograms: new Map(),
    degreeRequirements: new Map(),
    programToTermAveragesMap: new Map(),
    termToProgramAveragesMap: new Map(),
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

    /**
     * Also contains things like enrollment characteristics.
     */
    const programToTermAveragesMap = new Map();
    data.programAveragesByTerm.forEach(average => {
      if (!programToTermAveragesMap.has(average.program)) {
        programToTermAveragesMap.set(average.program, []);
      }
      programToTermAveragesMap.get(average.program).push(average);
    });

    const termToProgramAveragesMap = new Map();
    data.programAveragesByTerm.forEach(average => {
      if (!termToProgramAveragesMap.has(average.term)) {
        termToProgramAveragesMap.set(average.term, []);
      }
      termToProgramAveragesMap.get(average.term).push(average);
    });

    setMaps({
      degreePrograms: degreeProgramsMap,
      degreeRequirements: degreeRequirementsMap,
      programToTermAveragesMap: programToTermAveragesMap,
      termToProgramAveragesMap: termToProgramAveragesMap,
    });
    setLoading(false);
  }, [data.degreePrograms, data.degreeRequirements, data.programAveragesByTerm]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps])
  
  /**
   * Memoize the context value such that there are no unncessary rerenders
   * upon a child component calling an instance of the context.
   */
  const contextValue: DegreeProgramContextValue = useMemo(() => ({
    data: data,
    maps: maps,
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