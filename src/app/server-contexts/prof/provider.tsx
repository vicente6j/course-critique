'use client'
import { HotResponse, ProfAverages, ProfAveragesByCourse, ProfAveragesByTerm, ProfInfo } from "@/app/api/prof";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface ProfProviderContextValue {
  profAverages: ProfAverages[] | null;
  profAveragesMap: Map<string, ProfAverages> | null;
  profAveragesByCourse: ProfAveragesByCourse[] | null;
  profAveragesByCourseMap: Map<string, ProfAveragesByCourse[]> | null;
  profAveragesByTerm: ProfAveragesByTerm[] | null;
  profAveragesByTermMap: Map<string, ProfAveragesByTerm[]> | null;
  profs: ProfInfo[] | null;
  profMap: Map<string, ProfInfo> | null;
  hotCourses: HotResponse[] | null;
  hotCoursesMap: Map<string, HotResponse> | null;
  loading: boolean;
}

export interface ProfProviderProps {
  profAverages: ProfAverages[];
  profAveragesByCourse: ProfAveragesByCourse[];
  profAveragesByTerm: ProfAveragesByTerm[];
  profInfo: ProfInfo[];
  hotCourses: HotResponse[];
  children: React.ReactNode;
}

const GlobalProfContext = createContext<ProfProviderContextValue | undefined>(undefined);

/**
 * ProfProvider manages professor-related data including averages, course histories,
 * and each professor's most frequently taught course (hot courses).
 */
const ProfProvider: FC<ProfProviderProps> = ({
  profAverages,
  profAveragesByCourse,
  profAveragesByTerm,
  profInfo,
  hotCourses,
  children,
}: ProfProviderProps) => {

  const [data, setData] = useState<{
    averages: ProfAverages[];
    averagesByCourse: ProfAveragesByCourse[];
    averagesByTerm: ProfAveragesByTerm[];
    profs: ProfInfo[];
    hotCourses: HotResponse[];
  }>({
    averages: profAverages,
    averagesByCourse: profAveragesByCourse,
    averagesByTerm: profAveragesByTerm,
    profs: profInfo,
    hotCourses: hotCourses,
  });
  const [maps, setMaps] = useState<{
    averages: Map<string, ProfAverages>;
    averagesByCourse: Map<string, ProfAveragesByCourse[]>;
    averagesByTerm: Map<string, ProfAveragesByTerm[]>;
    profs: Map<string, ProfInfo>;
    hotCourses: Map<string, HotResponse>;
  }>({
    averages: new Map(),
    averagesByCourse: new Map(),
    averagesByTerm: new Map(),
    profs: new Map(),
    hotCourses: new Map(),
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {
    const averagesMap = new Map(data.averages.map(profAverage => [profAverage.prof_id, profAverage]));

    const averagesByCourseMap = new Map();
    data.averagesByCourse?.forEach(average => {
      const existing = averagesByCourseMap.get(average.prof_id) || [];
      averagesByCourseMap.set(average.prof_id, [...existing, average]);
    });

    const averagesByTermMap = new Map();
    data.averagesByTerm?.forEach(average => {
      const existing = averagesByTermMap.get(average.prof_id) || [];
      averagesByTermMap.set(average.prof_id, [...existing, average]);
    });

    const profMap = new Map(data.profs?.map(prof => [prof.instructor_id, prof]));
    const hotCoursesMap = new Map(data.hotCourses.map(hotCourse => [hotCourse.prof, hotCourse]));

    setMaps({
      averages: averagesMap,
      averagesByCourse: averagesByCourseMap,
      averagesByTerm: averagesByTermMap,
      profs: profMap,
      hotCourses: hotCoursesMap,
    });
    setLoading(false);
  }, [data]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  const contextValue: ProfProviderContextValue = useMemo(() => ({
    profAverages: data.averages,
    profAveragesMap: maps.averages,
    profAveragesByCourse: data.averagesByCourse,
    profAveragesByCourseMap: maps.averagesByCourse,
    profAveragesByTerm: data.averagesByTerm,
    profAveragesByTermMap: maps.averagesByTerm,
    profs: data.profs,
    profMap: maps.profs,
    hotCourses: data.hotCourses,
    hotCoursesMap: maps.hotCourses,
    loading: loading,
  }), [data, maps, loading]);

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