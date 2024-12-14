'use client'
import { CourseAverages, CourseAveragesByProf, CourseAveragesByTerm, CourseInfo } from "@/app/api/course";
import { createContext, FC, useCallback, useContext, useEffect, useState } from "react";

export interface CourseProviderContextValue {
  averages: CourseAverages[] | null;
  averagesMap: Map<string, CourseAverages> | null;
  averagesByProf: CourseAveragesByProf[] | null;
  averagesByProfMap: Map<string, CourseAveragesByProf[]> | null;
  averagesByTerm: CourseAveragesByTerm[] | null;
  averagesByTermMap: Map<string, CourseAveragesByTerm[]> | null;
  courses: CourseInfo[] | null;
  coursesMap: Map<string, CourseInfo> | null;
  loading: boolean;
  error: string | null;
}

export interface CourseProviderProps {
  courseAveragesPure: CourseAverages[];
  courseAveragesByProf: CourseAveragesByProf[];
  courseAveragesByTerm: CourseAveragesByTerm[];
  courseInfo: CourseInfo[];
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
  courseAveragesPure,
  courseAveragesByProf,
  courseAveragesByTerm,
  courseInfo,
  children,
}: CourseProviderProps) => {

  const [averages, setAverages] = useState<CourseAverages[] | null>(courseAveragesPure);
  const [averagesByProf, setAveragesByProf] = useState<CourseAveragesByProf[] | null>(courseAveragesByProf);
  const [averagesByTerm, setAveragesByTerm] = useState<CourseAveragesByTerm[] | null>(courseAveragesByTerm);
  const [courses, setCourses] = useState<CourseInfo[] | null>(courseInfo);

  const [averagesMap, setAveragesMap] = useState<Map<string, CourseAverages> | null>(new Map());
  const [averagesByProfMap, setAveragesByProfMap] = useState<Map<string, CourseAveragesByProf[]> | null>(new Map());
  const [averagesByTermMap, setAveragesByTermMap] = useState<Map<string, CourseAveragesByTerm[]> | null>(new Map());
  const [coursesMap, setCoursesMap] = useState<Map<string, CourseInfo> | null>(new Map());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const constructMaps: () => void = useCallback(() => {
    try {
      const averagesMap = new Map(averages!.map(average => [average.course_id, average]));
      setAveragesMap(averagesMap);

      const averagesByProfMap = new Map();
      for (const average of averagesByProf!) {
        if (!averagesByProfMap.has(average.course_id)) {
          averagesByProfMap.set(average.course_id, []);
        }
        averagesByProfMap.get(average.course_id)!.push(average);
      }
      setAveragesByProfMap(averagesByProfMap);

      const averagesByTermMap = new Map();
      for (const average of averagesByTerm!) {
        if (!averagesByTermMap.has(average.course_id)) {
          averagesByTermMap.set(average.course_id, []);
        }
        averagesByTermMap.get(average.course_id)!.push(average);
      }
      setAveragesByTermMap(averagesByTermMap);

      const coursesMap = new Map(courses!.map(course => [course.id, course]));
      setCoursesMap(coursesMap);
    } catch (error) {
      setError(error as string);
      console.error(error);
    }
    setLoading(false);
  }, [averages, averagesByProf, averagesByTerm, courses]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  return (
    <GlobalCourseContext.Provider 
      value={{ 
        averages,
        averagesMap,
        averagesByProf,
        averagesByProfMap,
        averagesByTerm,
        averagesByTermMap,
        courses,
        coursesMap,
        loading,
        error
      }}
    >
      {children}
    </GlobalCourseContext.Provider>
  );
}

export const useCourses = (): CourseProviderContextValue => {
  const context = useContext(GlobalCourseContext);
  if (context === undefined) {
    throw new Error('useCourseProvider must be used within a CourseProvider');
  }
  return context;
}

export default CourseProvider;