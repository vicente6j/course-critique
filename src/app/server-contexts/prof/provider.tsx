'use client'
import { CoursesTaughtByTerm, HotResponse, ProfAverages, ProfAveragesByCourse, ProfAveragesByTerm, ProfInfo } from "@/app/api/prof";
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
  coursesTaughtByTerm: CoursesTaughtByTerm[];
  coursesTaughtByTermMap: Map<string, Map<string, CoursesTaughtByTerm>> | null;
  getSortedAveragesByTermMap: () => Map<string, ProfAveragesByTerm[]>;
  loading: boolean;
}

export interface ProfProviderProps {
  profAverages: ProfAverages[];
  profAveragesByCourse: ProfAveragesByCourse[];
  profAveragesByTerm: ProfAveragesByTerm[];
  profInfo: ProfInfo[];
  hotCourses: HotResponse[];
  coursesTaughtByTerm: CoursesTaughtByTerm[];
  children: React.ReactNode;
}

export interface ProfProviderData {
  averages: ProfAverages[];
  averagesByCourse: ProfAveragesByCourse[];
  averagesByTerm: ProfAveragesByTerm[];
  profs: ProfInfo[];
  hotCourses: HotResponse[];
  coursesTaughtByTerm: CoursesTaughtByTerm[];
}

export interface ProfProviderMaps {
  averages: Map<string, ProfAverages>;
  averagesByCourse: Map<string, ProfAveragesByCourse[]>;
  averagesByTerm: Map<string, ProfAveragesByTerm[]>;
  profs: Map<string, ProfInfo>;
  hotCourses: Map<string, HotResponse>;
  coursesTaughtByTerm: Map<string, Map<string, CoursesTaughtByTerm>>;
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
  coursesTaughtByTerm,
  children,
}: ProfProviderProps) => {

  const [data] = useState<ProfProviderData>({
    averages: profAverages,
    averagesByCourse: profAveragesByCourse,
    averagesByTerm: profAveragesByTerm,
    profs: profInfo,
    hotCourses: hotCourses,
    coursesTaughtByTerm: coursesTaughtByTerm
  });
  const [maps, setMaps] = useState<ProfProviderMaps>({
    averages: new Map(),
    averagesByCourse: new Map(),
    averagesByTerm: new Map(),
    profs: new Map(),
    hotCourses: new Map(),
    coursesTaughtByTerm: new Map(),
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {
    const averagesMap = new Map(data.averages.map(profAverage => [profAverage.prof_id, profAverage]));

    const averagesByCourseMap = new Map();
    data.averagesByCourse.forEach(average => {
      if (!averagesByCourseMap.has(average.prof_id)) {
        averagesByCourseMap.set(average.prof_id, []);
      }
      averagesByCourseMap.get(average.prof_id).push(average);
    });

    const averagesByTermMap = new Map();
    data.averagesByTerm.forEach(termAverage => {
      if (!averagesByTermMap.has(termAverage.prof_id)) {
        averagesByTermMap.set(termAverage.prof_id, []);
      }
      averagesByTermMap.get(termAverage.prof_id).push(termAverage);
    })

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
    const hotCoursesMap = new Map(data.hotCourses.map(hotCourse => [hotCourse.prof, hotCourse]));

    setMaps({
      averages: averagesMap,
      averagesByCourse: averagesByCourseMap,
      averagesByTerm: averagesByTermMap,
      profs: profMap,
      hotCourses: hotCoursesMap,
      coursesTaughtByTerm: coursesTaughtByTermDualMap,
    });
    setLoading(false);
  }, [data]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  const getSortedAveragesByTermMap: () => Map<string, ProfAveragesByTerm[]>  = useCallback(() => {
    const sortedMap = new Map(maps.averagesByTerm);
    sortedMap.keys().forEach((term: string) => {
      console.log(term);
      sortedMap.set(term, sortedMap.get(term)!.sort((a: ProfAveragesByTerm, b: ProfAveragesByTerm) => a.GPA! - b.GPA!));
    });
    return sortedMap;
  }, [maps.averagesByTerm]);

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
    coursesTaughtByTerm: data.coursesTaughtByTerm,
    coursesTaughtByTermMap: maps.coursesTaughtByTerm,
    getSortedAveragesByTermMap: getSortedAveragesByTermMap,
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