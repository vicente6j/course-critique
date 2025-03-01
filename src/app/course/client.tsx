'use client'
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CompiledProf, CompiledResponse, CourseFetchAggregate, CourseHistory, CourseInfo, CourseResponse, RelatedCourse } from "./fetch";
import GradeTable, { formatGPA, GradeTableRow } from "../shared/gradeTable";
import FlexCol from "../deprecated/design-system/flexCol";
import Navbar from "../navigation/navbar";
import { Spinner } from "@nextui-org/spinner";
import CourseHeader from "./header";
import History from "./history";
import DonutChart from "../shared/donutChart";
import { useRouter } from 'next/router';
import { Link, Skeleton } from "@nextui-org/react";
import Info from "./info";
import ProfessorOrCourseTable from "../shared/professorOrCourseTable";
import SidePanel from "./sidepanel";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useCourses } from "../contexts/server/course/provider";
import { useProfs } from "../contexts/server/prof/provider";

export interface CourseClientProps {
  courseID: string;
  courseFetchAggregate: CourseFetchAggregate;
  fetchLoading: boolean;
}

export interface ProfAndAvg {
  profID: string;
  GPA: number;
}

const CourseClient: FC<CourseClientProps> = ({
  courseID,
  courseFetchAggregate,
  fetchLoading,
}: CourseClientProps) => {

  const [aggregateRow, setAggregateRow] = useState<GradeTableRow>({ key: 'major' });
  const [instructorRows, setInstructorRows] = useState<GradeTableRow[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [arrowRight, setArrowRight] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { maps } = useCourses();
  const { maps: profMaps } = useProfs();

  /**
   * Here we simply compute the row from the averages map. Computing this
   * from our context is order 20-50ms.
   */
  const computeRow: () => void = useCallback(() => {
    if (!maps.averagesMap || !maps.averagesMap.has(courseID)) {
      setError('Averages map was null or didn\'t contain course ID.');
      return;
    }
    setAggregateRow({
      ...aggregateRow,
      A: maps.averagesMap.get(courseID)!.A as number,
      B: maps.averagesMap.get(courseID)!.B as number,
      C: maps.averagesMap.get(courseID)!.C as number,
      D: maps.averagesMap.get(courseID)!.D as number,
      F: maps.averagesMap.get(courseID)!.F as number,
      W: maps.averagesMap.get(courseID)!.W as number,
      GPA: maps.averagesMap.get(courseID)!.GPA as number,
    });
  }, [maps.averagesMap, courseID]);

  const computeInstructors: () => void = useCallback(() => {
    if (!maps.profAveragesByCourseMap || !maps.profAveragesByCourseMap.has(courseID)) {
      setError('Averages map was null or didn\'t contain course ID.');
      return;
    }
    let newRows: GradeTableRow[] = [];
    for (const prof of maps.profAveragesByCourseMap?.get(courseID)!) {
      newRows.push({
        key: prof.prof_id,
        professor: prof.prof_id,
        A: prof.A as number,
        B: prof.B as number,
        C: prof.C as number,
        D: prof.D as number,
        F: prof.F as number,
        W: prof.W as number,
        GPA: prof.GPA as number,
      });
    }
    setInstructorRows(newRows);
  }, [maps.profAveragesByCourseMap, courseID]);

  const percentiles: Map<number, ProfAndAvg> = useMemo(() => {
    if (!maps.profAveragesByCourseMap || !maps.profAveragesByCourseMap.has(courseID)) {
      return new Map();
    }
    let sorted: ProfAndAvg[] = [];
    for (const prof of maps.profAveragesByCourseMap?.get(courseID)!) {
      sorted.push({ 
        profID: prof.prof_id, 
        GPA: prof.GPA! 
      });
    }
    sorted.sort((a: ProfAndAvg, b: ProfAndAvg) => a.GPA - b.GPA);
    let percentiles: Map<number, ProfAndAvg> = new Map();
    let p1 = Math.floor(sorted.length * (1 / 4));
    let p2 = Math.floor(sorted.length * (1 / 2));
    let p3 = Math.floor(sorted.length * (3 / 4));
    percentiles.set(25, sorted[p1]);
    percentiles.set(50, sorted[p2]);
    percentiles.set(75, sorted[p3]);
    return percentiles;
  }, [maps.profAveragesByCourseMap, courseID]);

  const sortedProfs: ProfAndAvg[] = useMemo(() => {
    if (!maps.profAveragesByCourseMap || !maps.profAveragesByCourseMap.has(courseID)) {
      return [];
    }
    let sorted: ProfAndAvg[] = [];
    for (const prof of maps.profAveragesByCourseMap?.get(courseID)!) {
      sorted.push({ 
        profID: prof.prof_id, 
        GPA: prof.GPA! 
      });
    }
    sorted.sort((a: ProfAndAvg, b: ProfAndAvg) => a.GPA - b.GPA);
    return sorted;
  }, [maps.profAveragesByCourseMap, courseID]);

  const taughtByIds: string[] = useMemo(() => {
    if (!maps.profAveragesByCourseMap || !maps.profAveragesByCourseMap.has(courseID)) {
      return [];
    }
    return [...maps.profAveragesByCourseMap.get(courseID)!.map(prof => prof.prof_id)]
  }, [courseID, maps.profAveragesByCourseMap]);

  useEffect(() => {
    computeRow();
    computeInstructors();
    setSelectedTab('overview');
  }, [computeRow, computeInstructors]);

  useEffect(() => {
    const originalQuery = `course?courseID=${encodeURIComponent(courseID)}`;
    window.history.replaceState({}, "courseTab", `${originalQuery}&tab=${selectedTab}`);
  }, [selectedTab]);

  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <div className="w-4/5 mx-auto mt-8">
        <div className="flex flex-col gap-8" key={courseID}>
          <CourseHeader 
            info={maps.courseMap!.get(courseID)!}
            taughtByIds={taughtByIds}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
          />
          <div className="flex flex-row justify space-between mb-8">
            <div className="flex-grow min-w-[73%] mr-4 bg-white p-8 rounded-md shadow-sm h-fit">
              {selectedTab === "overview" ? (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-6">
                    <h1 className="heading-md font-loose">{courseID} Overview</h1>
                    <p className="text-gray-400 text-sm">
                      {courseID} GPAs range from 
                      <span className="font-bold"> {percentiles.get(25)?.GPA.toFixed(2)} </span>
                        on the low end (25th percentile) to 
                      <span className="font-bold"> {percentiles.get(75)?.GPA.toFixed(2)} </span>
                        on the high end (75th percentile). The highest ranked professors for {courseID} include{' '} 
                      {sortedProfs.slice(0,3).map((prof, idx) => {
                        return (
                        <span 
                          key={prof.profID}
                          className="font-semi-bold"
                        >
                          {profMaps.profs!.get(prof.profID)?.instructor_name}
                          {idx === 0 && <>, </>}
                          {idx === 1 && <>, and </>}
                          {idx === 2 && <>. </>}
                        </span>
                        )
                      })}
                    </p>
                    <div className="flex flex-col gap-4">
                      <DonutChart 
                        aggregateRow={aggregateRow}
                        history={courseFetchAggregate?.courseHistory}
                        compiledResponse={courseFetchAggregate?.compiledResponse}
                        fetchLoading={fetchLoading} 
                        forTerm={false}
                      />
                      <GradeTable 
                        rows={[aggregateRow]} 
                        forTerm={false}
                      />
                    </div>
                  </div>
                  <div 
                    className="flex flex-row gap-4 px-4 py-2 bg-levels-blue rounded-lg cursor-pointer "
                    onClick={() => {
                      setSelectedTab('history')
                      window.scrollTo({ top: 0 });
                    }}
                    onMouseEnter={() => {
                      setArrowRight(true);
                    }}
                    onMouseLeave={() => {
                      setArrowRight(false);
                    }}
                  >
                    <Link 
                      className="text-sm"
                      onClick={() => {
                        setSelectedTab('history')
                        window.scrollTo({ top: 0 });
                      }}
                    >
                      Check out course history
                    </Link>
                    <div className={`transition ease-out duration-200 ${arrowRight ? 'translate-x-2' : ''}`}>
                      <ArrowRightAltIcon 
                        className="hover:cursor-pointer"
                        style={{ color: '#338ef7' }} 
                      />
                    </div>
                  </div>
                  <ProfessorOrCourseTable 
                    rows={instructorRows} 
                    forProf={true} 
                  />
                </div>
              ) : selectedTab === 'history' ? (
                <div className="flex flex-col gap-4">
                  <h1 className="heading-md font-loose">{courseID} History</h1>
                  <History 
                    courseHistory={courseFetchAggregate?.courseHistory}
                    courseID={courseID}
                    fetchLoading={fetchLoading} 
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h1 className="heading-md font-loose">{courseID} Info</h1>
                  <Info 
                    courseInfo={courseFetchAggregate?.info} 
                    compiledResponse={courseFetchAggregate?.compiledResponse} 
                    fetchLoading={fetchLoading} 
                  />
                </div>
              )}
            </div>
            <SidePanel 
              relatedCourses={courseFetchAggregate?.related_courses} 
              courseInfo={courseFetchAggregate?.info} 
              fetchLoading={fetchLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )  
}

export default CourseClient;