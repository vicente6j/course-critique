'use client'
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CompiledProf, CourseHistory, SectionDataTruncated, TermData } from "./fetch";
import GradeTable, { GradeTableRow } from "../shared/gradeTable";
import ProfessorTableExpandable from "../shared/expandableTable";
import { Input, Link, Pagination } from "@nextui-org/react";
import { SearchIcon } from "../../../public/icons/searchIcon";
import ExpandableTable from "../shared/expandableTable";
import ProfessorOrCourseTable from "../shared/professorOrCourseTable";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import DonutChart from "../shared/donutChart";

export interface TermDisplayData {
  term: string;
  aggregateRow: GradeTableRow;
  instructorRows: GradeTableRow[];
  sectionRows?: Map<string, GradeTableRow[]>;
  total_enrollment: number;
}

export const termOrder: Record<string, number> = {
  'Fall': 3,
  'Summer': 2,
  'Spring': 1,
};

export interface HistoryProps {
  courseHistory: CourseHistory;
  courseID: string;
  fetchLoading: boolean;
}

const History: FC<HistoryProps> = ({
  courseHistory,
  fetchLoading,
  courseID,
}: HistoryProps) => {

  const [searchValue, setSearchValue] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(4);
  const [page, setPage] = useState<number>(1);
  const [term, setTerm] = useState<string | null>(null);
  const [arrowRightArray, setArrowRightArray] = useState<boolean[]>([]);
  const [termMap, setTermMap] = useState<Map<string, TermDisplayData>>(new Map());
  const [indexMap, setIndexMap] = useState<Map<string, number>>(new Map()); /** just for constant time lookups */

  if (fetchLoading) {
    return <></>;
  }

  const numPages = Math.ceil(courseHistory.terms.length / rowsPerPage);
  const hasSearchFilter = Boolean(searchValue);

  const filteredTerms: TermData[] = useMemo(() => {
    if (!hasSearchFilter) {
      return [...courseHistory.terms];
    }
    return [...courseHistory.terms].filter(term => 
      term.term.toString().toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, courseHistory.terms]);

  const terms: TermDisplayData[] = useMemo(() => {

    let termSectionMap: Map<string, Map<string, GradeTableRow[]>> = new Map();
    for (const termData of filteredTerms) {
      let sectionMap: Map<string, GradeTableRow[]> = new Map();
      termData.profs.forEach((prof: CompiledProf) => {
        let tableRows: GradeTableRow[] = termData.sections!.get(prof.instructor_id)!.map((section: SectionDataTruncated) => {
          return {
            key: section.section,
            section: section.section,
            A: section.A as number,
            B: section.B as number,
            C: section.C as number,
            D: section.D as number,
            F: section.F as number,
            W: section.W as number,
            GPA: section.GPA as number,
            enrollment: section.enrollment as number,
          }
        });
        sectionMap.set(prof.instructor_id, tableRows);
      });
      termSectionMap.set(termData.term, sectionMap);
    }

    const newTerms: TermDisplayData[] = filteredTerms.map((termData: TermData) => ({
      term: termData.term,
      aggregateRow: {
        key: termData.term,
        A: termData.A as number,
        B: termData.B as number,
        C: termData.C as number,
        D: termData.D as number,
        F: termData.F as number,
        W: termData.W as number,
        GPA: termData.GPA as number,
        enrollment: termData.total_enrollment as number,
      },
      instructorRows: termData.profs.map((prof: CompiledProf) => ({
        key: prof.instructor_id,
        professor: prof.instructor_id,
        A: prof.A as number,
        B: prof.B as number,
        C: prof.C as number,
        D: prof.D as number,
        F: prof.F as number,
        W: prof.W as number,
        GPA: prof.GPA as number,
        enrollment: prof.total_enrollment as number,
      })),
      sectionRows: termSectionMap.get(termData.term),
      total_enrollment: termData.total_enrollment,
    }));

    newTerms.sort((a, b) => {
      const [termA, yearA] = a.term.split(" ");
      const [termB, yearB] = b.term.split(" ");

      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      return termOrder[termB] - termOrder[termA];
    });

    let map: Map<string, TermDisplayData> = new Map();
    let arr: boolean[] = [];
    let indexMap: Map<string, number> = new Map();
    let idx = 0;
    newTerms.forEach((term: TermDisplayData) => {
      map.set(term.term, term);
      arr.push(false);
      indexMap.set(term.term, idx);
      idx++;
    });
    setArrowRightArray(arr);
    setTermMap(map);
    setIndexMap(indexMap);

    return newTerms;
  }, [filteredTerms]);

  const slicedItems: TermDisplayData[] = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return terms.slice(start, end);
  }, [page, terms, rowsPerPage]);

  /**
   * If the term has a 
   *   1. Similar term in the previous year (e.g. summer 2024 --> summer 2023), obtain this one.
   *   2. If (1) is not true, just obtain the immediately previous term (e.g. summer 2024 --> spring 2024).
   */
  const prevTerm: TermDisplayData | null = useMemo(() => {
    if (!term) {
      return null;
    }
    let idx = indexMap.get(term)!;
    let termA = terms[idx].term.split(' ')[0];
    let year = terms[idx].term.split(' ')[1];
    for (let i = idx + 1; i < terms.length; i++) {
      /** If we go past the previous year, break. */
      if (Math.abs(Number(terms[i].term.split(' ')[1]) - Number(year)) > 1) {
        break;
      }
      if (terms[i].term.split(' ')[0] == termA) {
        return terms[i];
      }
    }
    return idx !== terms.length - 1 ? terms[idx + 1] : null;
  }, [terms, term]);

  const getDiff: (term1: TermDisplayData, term2: TermDisplayData) => number = useCallback((term1: TermDisplayData, term2: TermDisplayData) => {
    return (term1.aggregateRow!.GPA as number) - (term2.aggregateRow!.GPA as number);
  }, [terms]);

  useEffect(() => {
    if (!term) {
      return;
    }
    const originalPath = `course?courseID=${encodeURIComponent(courseID)}`;
    window.history.replaceState({}, "courseTab", `${originalPath}&tab=history&term=${term}`);
  }, [term]);

  const onRowsPerPageChange: (e: any) => void = useCallback((e: any) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange: (value: string) => void = useCallback((value: string) => {
    if (value) {
      setSearchValue(value);
      setPage(1);
    } else {
      setSearchValue("");
    }
  }, []);

  const onClear: () => void = useCallback(() => {
    setSearchValue("");
    setPage(1);
  }, []);

  return (
    <div className="flex flex-col">
      {term ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-row gap-2">
            <ArrowRightAltIcon 
              onClick={() => {
                setTerm(null);
              }}
              className="hover:cursor-pointer"
              style={{ color: '#888888', transform: 'rotate(180deg)' }} 
            />
            <Link 
              onClick={() => {
                setTerm(null);
              }}
              className="text-sm hover:underline cursor-pointer text-gray-400"
            >
              Go back to history
            </Link>
          </div>
          <h1 className="heading-sm font-semi-bold">{term}</h1>
          <p className="text-sm text-gray-400">
            During the {term} term {courseID} obtained an overall GPA of {' '}
            <span className="font-bold">{Number(termMap.get(term)!.aggregateRow.GPA).toFixed(2)}</span>.{' '}
            {prevTerm ? (
               <>This is{' '} 
               <span className="font-bold">{Math.abs(getDiff(termMap.get(term)!, prevTerm)).toFixed(2)}</span> points {getDiff(termMap.get(term)!, prevTerm) < 0 ? 'smaller' : 'larger'} 
               {' '}than in {prevTerm.term} ({Number(prevTerm.aggregateRow.GPA).toFixed(2)}).</>
            ) : (
              <></>
            )}
          </p>
          <DonutChart aggregateRow={termMap.get(term)!.aggregateRow} forTerm={true} />
          <GradeTable rows={[termMap.get(term)!.aggregateRow]} forTerm={true} />
          <ExpandableTable 
            rows={termMap.get(term)!.instructorRows} 
            sectionRows={termMap.get(term)!.sectionRows!} 
            forProf={true}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <p className="text-gray-400 text-sm">
              Found {terms.length} terms{' '}
              {terms.length > 0 && (
                <>spanning {terms[0].term} to {terms[terms.length - 1].term}.</>
              )}
            </p>
            <Input
              isClearable
              classNames={{
                base: "w-full sm:max-w-[44%]",
                inputWrapper: "border-1",
              }}
              placeholder="Search for a term..."
              startContent={<SearchIcon />}
              value={searchValue}
              onClear={onClear}
              onValueChange={onSearchChange}
            />
          </div>
          <div className="flex flex-col gap-8">
            {slicedItems?.map((term: TermDisplayData, idx: number) => {
              return (
                <div key={term.term} className="flex flex-col gap-4">
                  <div 
                    className="flex flex-col gap-4 p-4 rounded-lg bg-levels-blue cursor-pointer"
                    onClick={() => {
                      setTerm(term.term);
                      window.scrollTo({ top: 0 });
                    }}
                    onMouseEnter={() => {
                      setArrowRightArray(prev => {
                        let arr: boolean[] = [...prev];
                        arr[idx] = true;
                        return arr;
                      });
                    }}
                    onMouseLeave={() => {
                      setArrowRightArray(prev => {
                        let arr: boolean[] = [...prev];
                        arr[idx] = false;
                        return arr;
                      });
                    }}
                  >
                    <div className="flex flex-row gap-4">
                      <Link
                        className="heading-sm cursor-pointer"
                        onClick={() => {
                          setTerm(term.term);
                          window.scrollTo({ top: 0 });
                        }}
                      >
                        {term.term}
                      </Link>
                      <div className={`transition ease-out duration-200 ${arrowRightArray[idx] ? 'translate-x-2' : ''}`}>
                        <ArrowRightAltIcon 
                          className="hover:cursor-pointer"
                          style={{ color: '#338ef7' }} 
                        />
                      </div>
                    </div>
                    <GradeTable rows={[term.aggregateRow]} forTerm={true} />
                  </div>
                </div>  
              )
            })}
            <div className="flex flex-col gap-4 mb-24">
              <label className="flex items-center text-sm">
                Rows per page:
                <select
                  className="bg-transparent outline-none text-default-400 text-small"
                  onChange={onRowsPerPageChange}
                  value={rowsPerPage}
                >
                  <option value="4">4</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                </select>
              </label>
              <Pagination
                isCompact
                showControls
                showShadow
                color="default"
                page={page}
                total={numPages}
                onChange={setPage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History;