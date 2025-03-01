'use client'
import { FC, useCallback, useEffect, useState } from "react";
import { CompiledCourse, CompiledProfResponse, ProfHistory, RelatedProf } from "./fetch";
import GradeTable, { formatGPA, GradeTableRow } from "../shared/gradeTable";
import { useRouter } from "next/navigation";
import Navbar from "../navigation/navbar";
import { Spinner } from "@nextui-org/spinner";
import ProfHeader from "./header";
import { Link } from "@nextui-org/react";
import DonutChart from "../shared/donutChart";
import ProfessorOrCourseTable from "../shared/professorOrCourseTable";
import History from "./history";
import Info from "./info";
import { ProfInfo } from "../api/prof";
import { useProfs } from "../contexts/server/prof/provider";

export interface ProfClientProps {
  compiledProfResponse: CompiledProfResponse | null;
  compiledCourses: CompiledCourse[] | null;
  profInfo: ProfInfo | null;
  profHistory: ProfHistory | null;
  relatedProfs: RelatedProf[] | null;
  loading: boolean;
}

const ProfClient: FC<ProfClientProps> = ({
  compiledProfResponse,
  compiledCourses,
  profInfo,
  profHistory,
  relatedProfs,
  loading,
}: ProfClientProps) => {

  const [aggregateRow, setAggregateRow] = useState<GradeTableRow>({ key: 'major' });
  const [courseRows, setCourseRows] = useState<GradeTableRow[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  const { 
    maps,
    data,
  } = useProfs();

  const router = useRouter();

  const computeRow: () => void = useCallback(() => {
    setAggregateRow({
      ...aggregateRow, /** jsut to store the key */
      A: compiledProfResponse?.A as number,
      B: compiledProfResponse?.B as number,
      C: compiledProfResponse?.C as number,
      D: compiledProfResponse?.D as number,
      F: compiledProfResponse?.F as number,
      W: compiledProfResponse?.W as number,
      GPA: compiledProfResponse?.GPA as number,
    });
  }, [compiledProfResponse]);

  const computeCourses: () => void = useCallback(() => {
    let newRows = [];
    for (const course of compiledCourses!) {
      newRows.push({
        key: course.course_id,
        course_id: course.course_id,
        A: course.A as number,
        B: course.B as number,
        C: course.C as number,
        D: course.D as number,
        F: course.F as number,
        W: course.W as number,
        GPA: course.GPA as number,
      });
    }
    setCourseRows(newRows);
  }, [compiledCourses]);

  useEffect(() => {
    computeRow();
    computeCourses();
    setSelectedTab('overview');
  }, [computeRow, computeCourses]);

  /**
   * Formatting on related professors.
   * @param param0 the related professor
   * @returns a function component for the span.
   */
  const FormattedGPA: FC<{ rel: RelatedProf }> = ({ rel }) => {
    const gpa = Number(averagesMap?.get(rel.prof_two)?.GPA);
    const color = formatGPA(gpa);
    return <span className="flex-shrink-0 inline" style={{ color: color }}>{gpa.toFixed(2)}</span>;
  };

  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <div className="w-4/5 mx-auto mt-8">
        {loading || profsLoading || averagesLoading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-8">
            <ProfHeader 
              profInfo={profInfo!}
              hasTaughtIds={Array.from(compiledProfResponse?.course_ids!)}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
            />
            <div className="flex flex-row justify space-between mb-8">
              <div className="flex-grow min-w-[73%] mr-4 bg-white p-8 rounded-md shadow-sm h-fit">
                {selectedTab === "overview" ? (
                  <div className="flex flex-col gap-8">
                    <h1 className="heading-md font-loose">{profInfo!.instructor_name} Overview</h1>
                    <div className="flex flex-col gap-12">
                      <div className="flex flex-col gap-4">
                        <DonutChart 
                          aggregateRow={aggregateRow} 
                          history={profHistory}
                          compiledResponse={compiledProfResponse}
                        />
                        <GradeTable rows={[aggregateRow]}/>
                      </div>
                      <ProfessorOrCourseTable rows={courseRows} forProf={false} />
                    </div>
                  </div>
                ) : selectedTab === 'history' ? (
                  <div className="flex flex-col gap-4">
                    <h1 className="heading-md font-loose">{profInfo!.instructor_name} History</h1>
                    <History profHistory={profHistory!} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <h1 className="heading-md font-loose">{profInfo!.instructor_name} Info</h1>
                    <Info profInfo={profInfo} compiledResponse={compiledProfResponse} />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 w-[22%] flex flex-col gap-4">
                <div className="bg-white p-8 rounded-md shadow-sm h-fit">
                  <p className="heading-sm mb-4">Related Professors</p>
                  <div className="flex flex-col gap-4">
                    {relatedProfs?.map((rel: RelatedProf) => {
                      return (
                        <div key={rel.prof_two}>
                          <div>
                            <Link 
                              onClick={() => {
                                router.push(`/prof?profID=${rel.prof_two}`);
                              }}
                              className="text-sm hover:underline cursor-pointer"
                            >
                              {profMap.get(rel.prof_two)?.instructor_name}
                            </Link>
                          </div>
                          <span className="w-fit text-xs text-gray-500">
                            {hotMap.get(profInfo!.instructor_id)} • <FormattedGPA rel={rel} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-md shadow-sm h-fit">
                  <p className="heading-sm mb-4">Other Resources</p>
                  <div className="flex flex-col gap-4">
                    <a href="https://catalog.gatech.edu/coursesaz/" className="text-sm text-gray-400 pl-2 hover:underline" target="_blank">Course Catalog</a>
                    <a href="https://gatech.smartevals.com/" className="text-sm text-gray-400 pl-2 hover:underline" target="_blank">CIOS Results</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )  
}

export default ProfClient;