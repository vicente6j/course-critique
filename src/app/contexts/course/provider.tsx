'use client'
import { CourseAverages, CourseAveragesByProf, CourseAveragesByTerm, CourseInfo } from "@/app/api/course";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CourseProviderContextValue {
  averages: CourseAverages[] | null;
  averagesMap: Map<string, CourseAverages> | null;
  averagesByProf: CourseAveragesByProf[] | null;
  averagesByProfMap: Map<string, CourseAveragesByProf[]> | null;
  averagesByTerm: CourseAveragesByTerm[] | null;
  courseToTermAveragesMap: Map<string, CourseAveragesByTerm[]> | null;
  termToCourseAveragesMap: Map<string, CourseAveragesByTerm[]> | null;
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
    courseToTermAveragesMap: Map<string, CourseAveragesByTerm[]>;
    termToCourseAveragesMap: Map<string, CourseAveragesByTerm[]>;
    courses: Map<string, CourseInfo>;
  }>({
    averages: new Map(),
    averagesByProf: new Map(),
    courseToTermAveragesMap: new Map(),
    termToCourseAveragesMap: new Map(),
    courses: new Map()
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {
    const averagesMap = new Map(data.averages.map(courseAverage => [courseAverage.course_id, courseAverage]));

    /**
     * Averages by prof matches on courses and gives each one
     * a list of prof averages. e.g. prof_id = mhb3, averages = {}
     */
    const averagesByProfMap = new Map();
    data.averagesByProf?.forEach(average => {
      const existing = averagesByProfMap.get(average.course_id) || [];
      averagesByProfMap.set(average.course_id, [...existing, average]);
    });

    /**
     * Meanwhile, averages by term should match on term and give a list
     * of courses, such that each term maps to the course averages which
     * were obtained during that period. e.g. fall 24 -> {averages}
     */
    const courseToTermAveragesMap = new Map();
    const termToCourseAveragesMap = new Map();
    data.averagesByTerm?.forEach(average => {
      const existingCourseList = courseToTermAveragesMap.get(average.course_id) || [];
      courseToTermAveragesMap.set(average.course_id, [...existingCourseList, average]);

      const existingTermList = termToCourseAveragesMap.get(average.term) || [];
      termToCourseAveragesMap.set(average.term, [...existingTermList, average]);
    });

    const courseMap = new Map(data.courses?.map(course => [course.id, course]));

    setMaps({
      averages: averagesMap,
      averagesByProf: averagesByProfMap,
      courseToTermAveragesMap: courseToTermAveragesMap,
      termToCourseAveragesMap: termToCourseAveragesMap,
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
    courseToTermAveragesMap: maps.courseToTermAveragesMap,
    termToCourseAveragesMap: maps.termToCourseAveragesMap,
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