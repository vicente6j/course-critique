'use client'

import { FC, useMemo, useState } from "react";
import Banner from "./banner";
import AverageOverTime from "./compareCourses";
import { useRankingsContext } from "../client-contexts/rankingsContext";
import RankingsTable, { RankingsTableRow } from "../rankings/rankingsTable";
import { metadata } from "../metadata";
import { useCourses } from "../server-contexts/course/provider";
import { getClientColorFromGPA } from "../utils";
import { useRouter } from "next/navigation";
import ArrowRight from "../components/arrowRight";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import MiniRankingsTable from "../shared/miniRankingsTable";
import InfoIcon from '@mui/icons-material/Info';
import CompareCourses from "./compareCourses";

export interface PrevTermInfo {
  term: string;
  GPA: number;
  numCourses: number;
  numProfs: number;
}

export interface HomePageProps {}

const HomePage: FC<HomePageProps> = ({

}: HomePageProps) => {

  const { 
    courseRankingsMap, 
    profRankingsMap 
  } = useRankingsContext();

  const { maps } = useCourses();

  const prevTermInfo: PrevTermInfo | null = useMemo(() => {
    if (!maps.termToCourseAveragesMap || maps.termToCourseAveragesMap.size === 0 || !profRankingsMap) {
      return null;
    }
    const term = metadata.global.most_recent_term;
    return {
      term: term,
      GPA: maps.termToCourseAveragesMap.get(term)!.find(average => average.course_id === 'ALL')?.GPA,
      numCourses: maps.termToCourseAveragesMap.get(term)!.length,
      numProfs: profRankingsMap.get(term)?.length
    } as PrevTermInfo;
  }, [maps.termToCourseAveragesMap, profRankingsMap]);

  const courseTermRankings: RankingsTableRow[] = useMemo(() => {
    if (!prevTermInfo || !courseRankingsMap || !courseRankingsMap.has(prevTermInfo.term)) {
      return [];
    }
    return courseRankingsMap.get(prevTermInfo.term)!;
  }, [prevTermInfo, courseRankingsMap]);

  const profTermRankings: RankingsTableRow[] = useMemo(() => {
    if (!prevTermInfo || !profRankingsMap || !profRankingsMap.has(prevTermInfo.term)) {
      return [];
    }
    return profRankingsMap.get(prevTermInfo.term)!;
  }, [prevTermInfo, profRankingsMap]);

  const courseSubheadingTuples: React.ReactNode[] = useMemo(() => {
    const termTuple = (
      <div className="flex flex-row gap-2 items-center">
        <NextToolTip 
          content={`Aggregated across all ${prevTermInfo?.numCourses} courses offered`} 
          className="w-fit"
        >
          <InfoIcon style={{ width: '15px' }} />
        </NextToolTip>
        <p className="text-sm">Term GPA</p>
        <p 
          className="text-sm font-semi-bold" 
          style={{ 
            color: getClientColorFromGPA(prevTermInfo?.GPA || 0.00) 
          }}
        >
          {Number(prevTermInfo?.GPA || 0.00).toFixed(2)}
        </p>
      </div>
    );
    const numCoursesTuple = (
      <div className="flex flex-row gap-2 items-center">
        <p className="text-sm">Num Courses</p>
        <p className="text-sm" >
          {prevTermInfo?.numCourses}
        </p>
      </div>
    );
    return [
      termTuple,
      numCoursesTuple,
    ]
  }, [prevTermInfo]);

  const profSubheadingTuples: React.ReactNode[] = useMemo(() => {
    const numProfsTuple = (
      <div className="flex flex-row gap-2 items-center">
        <p className="text-sm">Num Profs</p>
        <p className="text-sm" >
          {prevTermInfo?.numProfs}
        </p>
      </div>
    );
    return [
      numProfsTuple,
    ]
  }, [prevTermInfo]);

  return (
    <div className="w-4/5 mx-auto my-8">
      <div className="flex flex-col gap-8">
        <Banner />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-8 gap-x-16">
          <MiniRankingsTable 
            header={'Hardest Courses Last Semester'}
            subheading={prevTermInfo?.term}
            subheadingTuples={courseSubheadingTuples}
            rows={courseTermRankings.slice(0, 5)}
            type={'course'}
          />
          <MiniRankingsTable 
            header={'Hardest Profs Last Semester'}
            subheading={prevTermInfo?.term}
            subheadingTuples={profSubheadingTuples}
            rows={profTermRankings.slice(0, 5)}
            type={'prof'}
          />
        </div>
        <CompareCourses />
      </div>
    </div>
  );
}

export default HomePage;