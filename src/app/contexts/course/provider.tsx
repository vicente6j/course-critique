'use client'
import { CourseAverages, CourseAveragesByProf, CourseAveragesByTerm, CourseInfo } from "@/app/api/course";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CourseProviderContextValue {
  averages: CourseAverages[] | null;
  averagesMap: Map<string, CourseAverages> | null;
  averagesByProf: CourseAveragesByProf[] | null;
  averagesByProfMap: Map<string, CourseAveragesByProf[]> | null;
  averagesByTerm: CourseAveragesByTerm[] | null;
  averagesByTermMap: Map<string, CourseAveragesByTerm[]> | null;
  courses: CourseInfo[] | null;
  courseMap: Map<string, CourseInfo> | null;
  loading: boolean;
}

export interface CourseProviderProps {
  courseAverages: CourseAverages[];
  courseAveragesByProf: CourseAveragesByProf[];
  courseAveragesByTerm: CourseAveragesByTerm[];
  courses: CourseInfo[];
  children: React.ReactNode;
}

export function getSizeInBytes<T>(arr: T[]): number {
  return new TextEncoder().encode(JSON.stringify(arr)).length;
}

/**
 * This provider stores a total of
 *  - 781KB (course_averages)
 *  - 7.5MB (course_averages_by_term)
 *  - 3.9MB (course_averages_by_prof)
 *  - 1.7MB (course_info)
 * 
 * all multiplied by two to account for hash tables for lookups.
 * This yields roughly ~13.88MB * 2 = ~27MB.
 */
const GlobalCourseContext = createContext<CourseProviderContextValue | undefined>(undefined);

const CourseProvider: FC<CourseProviderProps> = ({
  courseAverages,
  courseAveragesByProf,
  courseAveragesByTerm,
  courses,
  children,
}: CourseProviderProps) => {

  const [data, setData] = useState<{
    averages: CourseAverages[];
    averagesByProf: CourseAveragesByProf[];
    averagesByTerm: CourseAveragesByTerm[];
    courses: CourseInfo[];
  }>({
    averages: courseAverages,
    averagesByProf: courseAveragesByProf,
    averagesByTerm: courseAveragesByTerm,
    courses: courses
  });
  const [maps, setMaps] = useState<{
    averages: Map<string, CourseAverages>;
    averagesByProf: Map<string, CourseAveragesByProf[]>;
    averagesByTerm: Map<string, CourseAveragesByTerm[]>;
    courses: Map<string, CourseInfo>;
  }>({
    averages: new Map(),
    averagesByProf: new Map(),
    averagesByTerm: new Map(),
    courses: new Map()
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {
    const averagesMap = new Map(data.averages.map(courseAverage => [courseAverage.course_id, courseAverage]));

    const averagesByProfMap = new Map();
    data.averagesByProf?.forEach(average => {
      const existing = averagesByProfMap.get(average.course_id) || [];
      averagesByProfMap.set(average.course_id, [...existing, average]);
    });

    const averagesByTermMap = new Map();
    data.averagesByTerm?.forEach(average => {
      const existing = averagesByTermMap.get(average.course_id) || [];
      averagesByTermMap.set(average.course_id, [...existing, average]);
    });

    const courseMap = new Map(data.courses?.map(course => [course.id, course]));

    setMaps({
      averages: averagesMap,
      averagesByProf: averagesByProfMap,
      averagesByTerm: averagesByTermMap,
      courses: courseMap
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
  const contextValue: CourseProviderContextValue = useMemo(() => ({
    averages: data.averages,
    averagesMap: maps.averages,
    averagesByProf: data.averagesByProf,
    averagesByProfMap: maps.averagesByProf,
    averagesByTerm: data.averagesByTerm,
    averagesByTermMap: maps.averagesByTerm,
    courses: data.courses,
    courseMap: maps.courses,
    loading: loading,
  }), [data, maps, loading]);

  return (
    <GlobalCourseContext.Provider value={contextValue}>
      {children}
    </GlobalCourseContext.Provider>
  );
}

export const useCourses = (): CourseProviderContextValue => {
  const context: CourseProviderContextValue | undefined = useContext(GlobalCourseContext);
  if (context === undefined) {
    throw new Error('useCourseProvider must be used within a CourseProvider');
  }
  return context;
}

export default CourseProvider;