'use client'
import { HotResponse, ProfAverages, ProfAveragesByCourse, ProfAveragesByTerm, ProfInfo } from "@/app/api/prof";
import { createContext, FC, useCallback, useContext, useEffect, useState } from "react";

export interface ProfProviderContextValue {
  profAverages: ProfAverages[] | null;
  profAveragesMap: Map<string, ProfAverages> | null;
  averagesByCourse: ProfAveragesByCourse[] | null;
  averagesByCourseMap: Map<string, ProfAveragesByCourse> | null;
  profAveragesByTerm: ProfAveragesByTerm[] | null;
  profAveragesByTermMap: Map<string, ProfAveragesByTerm> | null;
  profs: ProfInfo[] | null;
  profsMap: Map<string, ProfInfo> | null;
  hotCourses: HotResponse[] | null;
  hotCoursesMap: Map<string, string> | null;
  loading: boolean;
  error: string | null;
}

export interface ProfProviderProps {
  profAveragesPure: ProfAverages[];
  profAveragesByCourse: ProfAveragesByCourse[];
  profAveragesByTerm: ProfAveragesByTerm[];
  profInfo: ProfInfo[];
  hotCourses: HotResponse[];
  children: React.ReactNode;
}

const GlobalProfContext = createContext<ProfProviderContextValue | undefined>(undefined);

const ProfProvider: FC<ProfProviderProps> = ({
  profAveragesPure,
  profAveragesByCourse,
  profAveragesByTerm,
  profInfo,
  hotCourses,
  children,
}: ProfProviderProps) => {

  const [profAverages, setProfAverages] = useState<ProfAverages[] | null>(profAveragesPure);
  const [averagesByCourse, setAveragesByCourse] = useState<ProfAveragesByCourse[] | null>(profAveragesByCourse);
  const [averagesByTerm, setAveragesByTerm] = useState<ProfAveragesByTerm[] | null>(profAveragesByTerm);
  const [profs, setProfs] = useState<ProfInfo[] | null>(profInfo);
  const [hotCoursesList, setHotCourses] = useState<HotResponse[] | null>(hotCourses);

  const [averagesMap, setAveragesMap] = useState<Map<string, ProfAverages> | null>(new Map());
  const [averagesByCourseMap, setAveragesByCourseMap] = useState<Map<string, ProfAveragesByCourse> | null>(new Map());
  const [averagesByTermMap, setAveragesByTermMap] = useState<Map<string, ProfAveragesByTerm> | null>(new Map());
  const [profsMap, setProfsMap] = useState<Map<string, ProfInfo> | null>(new Map());
  const [hotCoursesMap, setHotCoursesMap] = useState<Map<string, string>>(new Map());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const constructMaps: () => void = useCallback(() => {
    try {
      const averagesMap = new Map(profAverages!.map(average => [average.prof_id, average]));
      setAveragesMap(averagesMap);

      const averagesByCourseMap = new Map();
      for (const average of averagesByCourse!) {
        if (!averagesByCourseMap.has(average.prof_id)) {
          averagesByCourseMap.set(average.prof_id, []);
        }
        averagesByCourseMap.get(average.prof_id)!.push(average);
      }
      setAveragesByCourseMap(averagesByCourseMap);

      const averagesByTermMap = new Map();
      for (const average of averagesByTerm!) {
        if (!averagesByTermMap.has(average.prof_id)) {
          averagesByTermMap.set(average.prof_id, []);
        }
        averagesByTermMap.get(average.prof_id)!.push(average);
      }
      setAveragesByTermMap(averagesByTermMap);

      const profMap = new Map(profs!.map(prof => [prof.instructor_id, prof]));
      setProfsMap(profMap);

      const hotMap = new Map(hotCoursesList!.map(hotness => [hotness.prof, hotness.hot_course]));
      setHotCoursesMap(hotMap);
    } catch (error) {
      setError(error as string);
      console.error(error);
    }
    setLoading(false);
  }, [profAverages, averagesByCourse, averagesByTerm, profs, hotCoursesList]);

  useEffect(() => {
    constructMaps();
  }, [constructMaps]);

  return (
    <GlobalProfContext.Provider 
      value={{ 
        profAverages: profAverages,
        profAveragesMap: averagesMap,
        averagesByCourse: averagesByCourse,
        averagesByCourseMap: averagesByCourseMap,
        profAveragesByTerm: averagesByTerm,
        profAveragesByTermMap: averagesByTermMap,
        profs: profs,
        profsMap: profsMap,
        hotCourses: hotCoursesList,
        hotCoursesMap: hotCoursesMap,
        loading: loading,
        error: error,
      }}
    >
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