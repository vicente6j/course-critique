'use client'
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { GradeTableRow } from "../shared/gradeTable";
import { Input } from "@nextui-org/react";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { SectionDataTruncated } from "../course/fetch";
import { termOrder } from "../course/history";
import ExpandableTable from "../shared/expandableTable";
import { CompiledCourse, ProfTermData, ProfHistory } from "./fetch";

export interface ProfHistoryProps {
  profHistory: ProfHistory;
}

export interface ProfTermDisplayData {
  term: string;
  aggregateRow: GradeTableRow;
  courseRows: GradeTableRow[];
  sectionRows?: Map<string, GradeTableRow[]>;
  total_enrollment: number;
}

const History: FC<ProfHistoryProps> = ({
  profHistory,
}: ProfHistoryProps) => {

  const [searchValue, setSearchValue] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [page, setPage] = useState<number>(1);

  const numPages = Math.ceil(profHistory.terms.length / rowsPerPage);
  const hasSearchFilter = Boolean(searchValue);

  const filteredTerms: ProfTermData[] = useMemo(() => {
    if (!hasSearchFilter) {
      return [...profHistory.terms];
    }
    return [...profHistory.terms].filter(term => 
      term.term.toString().toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, profHistory.terms]);

  const items: ProfTermData[] = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredTerms.slice(start, end);
  }, [page, filteredTerms, rowsPerPage]);

  /**
   * Goal of this is to just map prof term data to a collection of GradeTableRows.
   * One of
   *  (a) aggregateRow -- complete prof averages for term
   *  (b) courseRows -- prof averages by course for term
   *  (c) sectionRows -- compiled sections retrieved 
   */
  const terms: ProfTermDisplayData[] = useMemo(() => {

    let termSectionMap: Map<string, Map<string, GradeTableRow[]>> = new Map();

    /** Computes section averages as grade table rows. */
    for (const termData of items) {
      let sectionMap: Map<string, GradeTableRow[]> = new Map();
      termData.courses.forEach((course: CompiledCourse) => {
        let tableRows: GradeTableRow[] = termData.sections!.get(course.course_id)!.map((section: SectionDataTruncated) => {
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
        sectionMap.set(course.course_id, tableRows);
      });
      termSectionMap.set(termData.term, sectionMap);
    }

    const newTerms: ProfTermDisplayData[] = items.map((termData: ProfTermData) => ({
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
      },
      courseRows: termData.courses.map((course: CompiledCourse) => ({
        key: course.course_id,
        course_id: course.course_id,
        A: course.A as number,
        B: course.B as number,
        C: course.C as number,
        D: course.D as number,
        F: course.F as number,
        W: course.W as number,
        GPA: course.GPA as number,
      })),
      sectionRows: termSectionMap.get(termData.term),
      total_enrollment: termData.total_enrollment,
    }));

    return newTerms.sort((a, b) => {
      const [termA, yearA] = a.term.split(" ");
      const [termB, yearB] = b.term.split(" ");

      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      return termOrder[termB] - termOrder[termA];
    });
  }, [items]);

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
    <div className="flex flex-col gap-12">
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
      <div className="flex flex-col gap-16">
        {terms?.map((term: ProfTermDisplayData) => {
          return (
            <div key={term.term} className="flex flex-col gap-0">
              <h1 className="heading-sm">{term.term}</h1>
              <ExpandableTable 
                rows={term.courseRows} 
                sectionRows={term.sectionRows!} 
                forProf={true}
              />
            </div>  
          )
        })}
      </div>
    </div>
  )
}

export default History;