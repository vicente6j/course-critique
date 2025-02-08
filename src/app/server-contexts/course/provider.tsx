'use client'
import { CourseAverages, CourseAveragesByTerm, CourseInfo, ProfAveragesByCourse } from "@/app/api/course";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CourseProviderContextValue {
  data: CourseProviderData;
  maps: CourseProviderMaps;
  getSortedAveragesByTermMap: () => Map<string, CourseAveragesByTerm[]>;
  loading: boolean;
}

export interface CourseProviderData {
  averages: CourseAverages[];
  profAveragesByCourse: ProfAveragesByCourse[];
  averagesByTerm: CourseAveragesByTerm[];
  courses: CourseInfo[];
}

export interface CourseProviderMaps {
  averagesMap: Map<string, CourseAverages> | null;
  profAveragesByCourseMap: Map<string, ProfAveragesByCourse[]> | null;
  courseToTermAveragesMap: Map<string, CourseAveragesByTerm[]> | null;
  termToCourseAveragesMap: Map<string, CourseAveragesByTerm[]> | null;
  courseMap: Map<string, CourseInfo> | null;
}

export interface CourseProviderProps {
  courseAverages: CourseAverages[];
  profAveragesByCourse: ProfAveragesByCourse[];
  courseAveragesByTerm: CourseAveragesByTerm[];
  courses: CourseInfo[];
  children: React.ReactNode;
}

export function getSizeInBytes<T>(arr: T[]): number {
  return new TextEncoder().encode(JSON.stringify(arr)).length;
}

const GlobalCourseContext = createContext<CourseProviderContextValue | undefined>(undefined);

const CourseProvider: FC<CourseProviderProps> = ({
  courseAverages,
  profAveragesByCourse,
  courseAveragesByTerm,
  courses,
  children,
}: CourseProviderProps) => {

  const [data] = useState<CourseProviderData>({
    averages: courseAverages,
    profAveragesByCourse: profAveragesByCourse,
    averagesByTerm: courseAveragesByTerm,
    courses: courses
  });
  const [maps, setMaps] = useState<CourseProviderMaps>({
    averagesMap: new Map(),
    profAveragesByCourseMap: new Map(),
    courseToTermAveragesMap: new Map(),
    termToCourseAveragesMap: new Map(),
    courseMap: new Map()
  });
  const [loading, setLoading] = useState<boolean>(true);

  const constructMaps: () => void = useCallback(() => {

    const averagesMap = new Map(data.averages.map(courseAverage => [courseAverage.course_id, courseAverage]));

    /**
     * Averages by prof matches on courses and gives each one
     * a list of prof averages. e.g. prof_id = mhb3, averages = {}
     */
    const profAveragesByCourseMap = new Map();
    data.profAveragesByCourse?.forEach(average => {
      if (!profAveragesByCourseMap.has(average.course_id)) {
        profAveragesByCourseMap.set(average.course_id, []);
      }
      profAveragesByCourseMap.get(average.course_id).push(average);
    });

    /**
     * Meanwhile, averages by term should match on term and give a list
     * of courses, such that each term maps to the course averages which
     * were obtained during that period. e.g. fall 24 -> {averages}.
     * 
     * A note here is that for every term, a select course_id labeled 'ALL'
     * accounts for ALL the courses offered in that term. e.g.
     *   Fa24 -> {all: {GPA: 3.02, ...}}
     * means ALL course averages for that term. 
     */
    const courseToTermAveragesMap = new Map();
    const termToCourseAveragesMap = new Map();
    data.averagesByTerm?.forEach(average => {
      if (!courseToTermAveragesMap.has(average.course_id)) {
        courseToTermAveragesMap.set(average.course_id, []);
      }
      courseToTermAveragesMap.get(average.course_id).push(average);

      if (!termToCourseAveragesMap.has(average.term)) {
        termToCourseAveragesMap.set(average.term, []);
      }
      termToCourseAveragesMap.get(average.term).push(average);
    });

    const courseMap = new Map(data.courses?.map(course => [course.id, course]));

    setMaps({
      averagesMap: averagesMap,
      profAveragesByCourseMap: profAveragesByCourseMap,
      courseToTermAveragesMap: courseToTermAveragesMap,
      termToCourseAveragesMap: termToCourseAveragesMap,
      courseMap: courseMap
    });
    setLoading(false);
  }, [data.averages]);

  /**
   * Throw this into a callback function because I prefer not to store
   * a bunch of hash tables for essentially the same data unless it's absolutely needed.
  */
  const getSortedAveragesByTermMap: () => Map<string, CourseAveragesByTerm[]>  = useCallback(() => {
    const sortedMap = new Map(maps.termToCourseAveragesMap);
    sortedMap.keys().forEach((term: string) => {
      sortedMap.set(term, sortedMap.get(term)!.sort((a: CourseAveragesByTerm, b: CourseAveragesByTerm) => a.GPA! - b.GPA!));
    });
    return sortedMap;
  }, [maps.termToCourseAveragesMap]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  /**
   * Memoize the context value such that there are no unncessary rerenders
   * upon a child component calling an instance of the context.
   */
  const contextValue: CourseProviderContextValue = useMemo(() => ({
    data: data,
    maps: maps,
    getSortedAveragesByTermMap: getSortedAveragesByTermMap,
    loading: loading,
  }), [data, maps, loading, getSortedAveragesByTermMap]);

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