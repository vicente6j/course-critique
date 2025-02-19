'use client'
import { useCallback, useEffect, useMemo, useState } from "react";
import { termToSortableInteger } from "../utils";
import { useCourses } from "../server-contexts/course/provider";
import { RankingsTableRow } from "../rankings/rankingsTable";
import { dataTerms } from "../metadata";
import { useProfs } from "../server-contexts/prof/provider";

interface UseRankingsValue {
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
    getSortedAveragesByTermMap: getSortedAveragesByTermMapProf,
    maps: profMaps,
  } = useProfs();

  /**
   * Generate rankings map without paying any attention to the
   * 'ALL' course average field. Use this for rankings tables.
   */
  const generateCourseRankingsMap: () => void = useCallback(() => {
    const sortedTermsMap = getSortedAveragesByTermMap();
    if (!sortedTermsMap) {
      return;
    }
    const termMap = new Map();
    for (const term of sortedTermsMap!.keys()) {
      termMap.set(term, []);
      let rank = 1;
      for (const termAverage of sortedTermsMap!.get(term)!) {
        if (termAverage.course_id === 'ALL') {
          continue;
        }
        termMap.get(term)!.push({
          key: termAverage.course_id,
          rank: rank,
          course_id: termAverage.course_id,
          course_name: maps.courseMap!.get(termAverage.course_id)?.course_name || 'Unknown course',
          GPA: termAverage.GPA!,
        });
        rank++;
      }
    }
    setCourseRankingsMap(termMap);
  }, [getSortedAveragesByTermMap, maps]);

  const generateProfRankingsMap: () => void = useCallback(() => {
    const sortedTermMap = getSortedAveragesByTermMapProf();
    if (!sortedTermMap || !profMaps.coursesTaughtByTerm) {
      return;
    }
    const termMap = new Map();
    for (const term of sortedTermMap!.keys()) {
      termMap.set(term, []);
      let rank = 1;
      for (const termAverage of sortedTermMap!.get(term)!) {
        termMap.get(term)!.push({
          key: termAverage.prof_id,
          rank: rank,
          prof_id: termAverage.prof_id,
          courses_taught_this_sem: profMaps.coursesTaughtByTerm.get(termAverage.term)?.get(termAverage.prof_id)?.courses_taught,
          GPA: termAverage.GPA!,
        });
        rank++;
      }
    }
    setProfRankingsMap(termMap);
  }, [getSortedAveragesByTermMap, profMaps.coursesTaughtByTerm]);

  useEffect(() => {
    if (courseRankingsMap && courseRankingsMap.size > 0) {
      setLoading(false);
    }
  }, [courseRankingsMap]);

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