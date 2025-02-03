'use client'
import { CourseAveragesByProf, CoursesTaughtByTerm, ProfAverages, ProfAveragesByTerm, ProfInfo } from "@/app/api/prof";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface ProfProviderContextValue {
  data: ProfProviderData;
  maps: ProfProviderMaps;
  getSortedAveragesByTermMap: () => Map<string, ProfAveragesByTerm[]>;
  loading: boolean;
}

export interface ProfProviderProps {
  profAverages: ProfAverages[];
  courseAveragesByProf: CourseAveragesByProf[];
  profAveragesByTerm: ProfAveragesByTerm[];
  profInfo: ProfInfo[];
  coursesTaughtByTerm: CoursesTaughtByTerm[];
  children: React.ReactNode;
}

export interface ProfProviderData {
  averages: ProfAverages[];
  courseAveragesByProf: CourseAveragesByProf[];
  averagesByTerm: ProfAveragesByTerm[];
  profs: ProfInfo[];
  coursesTaughtByTerm: CoursesTaughtByTerm[];
}

export interface ProfProviderMaps {
  averages: Map<string, ProfAverages>;
  courseAveragesByProf: Map<string, CourseAveragesByProf[]>;
  profToTermAverages: Map<string, ProfAveragesByTerm[]>;
  termToProfAverages: Map<string, ProfAveragesByTerm[]>;
  profs: Map<string, ProfInfo>;
  coursesTaughtByTerm: Map<string, Map<string, CoursesTaughtByTerm>>;
}

const GlobalProfContext = createContext<ProfProviderContextValue | undefined>(undefined);

/**
 * ProfProvider manages professor-related data including averages, course histories,
 * and each professor's most frequently taught course (hot courses).
 */
const ProfProvider: FC<ProfProviderProps> = ({
  profAverages,
  courseAveragesByProf,
  profAveragesByTerm,
  profInfo,
  coursesTaughtByTerm,
  children,
}: ProfProviderProps) => {

  const [data] = useState<ProfProviderData>({
    averages: profAverages,
    courseAveragesByProf: courseAveragesByProf,
    averagesByTerm: profAveragesByTerm,
    profs: profInfo,
    coursesTaughtByTerm: coursesTaughtByTerm
  });
  const [maps, setMaps] = useState<ProfProviderMaps>({
    averages: new Map(),
    courseAveragesByProf: new Map(),
    profToTermAverages: new Map(),
    termToProfAverages: new Map(),
    profs: new Map(),
    coursesTaughtByTerm: new Map(),
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {
    const averagesMap = new Map(data.averages.map(profAverage => [profAverage.prof_id, profAverage]));

    const courseAveragesByProfMap = new Map();
    data.courseAveragesByProf.forEach(average => {
      if (!courseAveragesByProfMap.has(average.prof_id)) {
        courseAveragesByProfMap.set(average.prof_id, []);
      }
      courseAveragesByProfMap.get(average.prof_id).push(average);
    });

    const profToTermAveragesMap = new Map();
    const termToProfAveragesMap = new Map();
    data.averagesByTerm.forEach(termAverage => {
      if (!profToTermAveragesMap.has(termAverage.prof_id)) {
        profToTermAveragesMap.set(termAverage.prof_id, []);
      }
      if (!termToProfAveragesMap.has(termAverage.term)) {
        termToProfAveragesMap.set(termAverage.term, []);
      }
      profToTermAveragesMap.get(termAverage.prof_id).push(termAverage);
      termToProfAveragesMap.get(termAverage.term).push(termAverage);
    });

    /**
     * Dual map serves the purpose of indexing by term first
     *  --> term
     * and then by prof
     *  --> term --> prof --> {courses I taught}
     */
    const coursesTaughtByTermDualMap = new Map();
    data.coursesTaughtByTerm.forEach(termLiteral => {
      if (!coursesTaughtByTermDualMap.has(termLiteral.term)) {
        coursesTaughtByTermDualMap.set(termLiteral.term, new Map());
      }
      coursesTaughtByTermDualMap.get(termLiteral.term).set(termLiteral.prof_id, termLiteral);
    });

    const profMap = new Map(data.profs?.map(prof => [prof.instructor_id, prof]));

    setMaps({
      averages: averagesMap,
      courseAveragesByProf: courseAveragesByProfMap,
      profToTermAverages: profToTermAveragesMap,
      termToProfAverages: termToProfAveragesMap,
      profs: profMap,
      coursesTaughtByTerm: coursesTaughtByTermDualMap,
    });
    setLoading(false);
  }, [data]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  const getSortedAveragesByTermMap: () => Map<string, ProfAveragesByTerm[]>  = useCallback(() => {
    const sortedMap = new Map(maps.termToProfAverages);
    sortedMap.keys().forEach((term: string) => {
      sortedMap.set(term, sortedMap.get(term)!.sort((a: ProfAveragesByTerm, b: ProfAveragesByTerm) => a.GPA! - b.GPA!));
    });
    return sortedMap;
  }, [maps.termToProfAverages]);

  const contextValue: ProfProviderContextValue = useMemo(() => ({
    data: data,
    maps: maps,
    getSortedAveragesByTermMap: getSortedAveragesByTermMap,
    loading: loading,
  }), [data, maps, getSortedAveragesByTermMap, loading]);

  return (
    <GlobalProfContext.Provider value={contextValue}>
      {children}
    </GlobalProfContext.Provider>
  );
}

export const useProfs = (): ProfProviderContextValue => {
  const context = useContext(GlobalProfContext);
  if (context === undefined) {
    throw new Error('useProfs must be used within a ProfProvider');
  }
  return context;
}

export default ProfProvider;