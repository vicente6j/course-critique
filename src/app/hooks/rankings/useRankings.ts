'use client'
import { useCallback, useEffect, useMemo, useState } from "react";
import { termToSortableInteger } from "../../utils";
import { useCourses } from "../../contexts/server/course/provider";
import { RankingsTableRow } from "../../rankings/rankingsTable";
import { dataTerms } from "../../metadata";
import { useProfs } from "../../contexts/server/prof/provider";

export interface UseRankingsValue {
  tabs: RankingsPageTab[];
  courseRankingsMap: Map<string, RankingsTableRow[]> | null;
  profRankingsMap: Map<string, RankingsTableRow[]> | null;
  loading: boolean;
}

export interface RankingsPageTab {
  id: string;
  label: string;
}

export const useRankings = (): UseRankingsValue => {

  const [courseRankingsMap, setCourseRankingsMap] = useState<Map<string, RankingsTableRow[]> | null>(null);
  const [profRankingsMap, setProfRankingsMap] = useState<Map<string, RankingsTableRow[]> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { 
    getSortedAveragesByTermMap, 
    maps 
  } = useCourses();

  const {
    sortByDecreasingGPAAndFilterEnrollment,
    maps: profMaps,
  } = useProfs();

  /**
   * Generate rankings map without paying any attention to the
   * 'ALL' course average field. Use this for rankings tables.
   */
  const generateCourseRankingsMap: () => void = useCallback(() => {
    const sortedTermsMap = getSortedAveragesByTermMap();
    const map = new Map();

    for (const term of sortedTermsMap!.keys()) {
      map.set(term, []);
      sortedTermsMap.get(term)!.forEach((termAverage, index) => {
        const termIndex = dataTerms.findIndex(termA => termA === term);
        const prevTerm = dataTerms[Math.max(termIndex - 1, 0)];
        const prevRank = sortedTermsMap.get(prevTerm)!.findIndex(termAverageA => termAverageA.course_id === termAverage.course_id);
        const rankingDifferential = prevRank === -1 ? null : index - prevRank;

        map.get(term)!.push({
          key: termAverage.course_id,
          rank: index + 1,
          course_id: termAverage.course_id,
          course_name: maps.courseMap!.get(termAverage.course_id)?.course_name || 'Unknown course',
          GPA: termAverage.GPA!,
          enrollment: termAverage.total,
          rankingDifferential: rankingDifferential,
        });
      });
    }
    setCourseRankingsMap(map);
  }, [getSortedAveragesByTermMap, maps]);

  const generateProfRankingsMap: () => void = useCallback(() => {
    const sortedTermsMap = sortByDecreasingGPAAndFilterEnrollment();
    if (!sortedTermsMap || !profMaps.coursesTaughtByTerm) {
      return;
    }
    const map = new Map();
    for (const term of sortedTermsMap!.keys()) {
      map.set(term, []);
      sortedTermsMap.get(term)!.forEach((termAverage, index) => {
        const termIndex = dataTerms.findIndex(termA => termA === term);
        const prevTerm = dataTerms[Math.max(termIndex - 1, 0)];
        const prevRank = sortedTermsMap.get(prevTerm)!.findIndex(entry => entry.prof_id === termAverage.prof_id);
        const rankingDifferential = prevRank === -1 ? null : index - prevRank;

        map.get(term)!.push({
          key: termAverage.prof_id,
          rank: index + 1,
          prof_id: termAverage.prof_id,
          courses_taught: profMaps.coursesTaughtByTerm.get(term)!.get(termAverage.prof_id)?.courses_taught,
          GPA: termAverage.GPA!,
          rankingDifferential: rankingDifferential,
          enrollment: termAverage.total,
        });
      })
    }
    setProfRankingsMap(map);
  }, [getSortedAveragesByTermMap, profMaps.coursesTaughtByTerm]);

  useEffect(() => {
    if (courseRankingsMap && courseRankingsMap.size > 0 && profRankingsMap && profRankingsMap.size > 0) {
      setLoading(false);
    }
  }, [courseRankingsMap, profRankingsMap]);

  useEffect(() => {
    generateCourseRankingsMap();
    generateProfRankingsMap();
  }, [generateCourseRankingsMap, generateProfRankingsMap]);

  const tabs: RankingsPageTab[] = useMemo(() => {
    const tabs: RankingsPageTab[] = [];
    for (const term of dataTerms) {
      tabs.push({
        id: term,
        label: term,
      });
    }
    tabs.sort((a, b) => termToSortableInteger(b.id) - termToSortableInteger(a.id));
    return tabs;
  }, []);

  return {
    tabs,
    courseRankingsMap,
    profRankingsMap,
    loading,
  };
};