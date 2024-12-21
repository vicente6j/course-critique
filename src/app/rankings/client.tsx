import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../shared/navbar";
import { Spinner } from "@nextui-org/spinner";
import RankingsTable, { RankingsTableRow } from "./rankingsTable";
import { Card, CardBody, Input, Pagination, Tab, Tabs } from "@nextui-org/react";
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import { termOrder } from "../course/history";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { useCourses } from "../contexts/course/provider";
import { CourseAveragesByTerm } from "../api/course";

export interface RankingsPageClientProps {}

export interface RankingsPageTab {
  id: string;
  label: string;
}

const excludedKeywords = [
  'Research Paper', 'Special Topics', 'Special Problems', 'Laboratory'
];

const RankingsPageClient: FC<RankingsPageClientProps> = ({

}: RankingsPageClientProps) => {

  const [termMap, setTermMap] = useState<Map<string, RankingsTableRow[]>>(new Map());
  const [termSelected, setTermSelected] = useState<string>("Summer 2024");
  const [searchValue, setSearchValue] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const { termToCourseAveragesMap } = useCourses();
  const { courseMap } = useCourses();

  const generateRankingsMap: () => void = useCallback(() => {
    const map: Map<string, RankingsTableRow[]> = new Map();
    for (const term of termToCourseAveragesMap!.keys()) {
      map.set(term, []);
      termToCourseAveragesMap!.get(term)!.sort((a, b) => {
        return (a.GPA as number ?? 0) - (b.GPA as number ?? 0);
      });
      let rank = 1;
      for (const termAverage of termToCourseAveragesMap!.get(term)!) {
        map.get(term)!.push({
          key: termAverage.course_id,
          rank: rank,
          course_id: termAverage.course_id,
          course_name: courseMap!.get(termAverage.course_id)?.course_name || 'Unknown course',
          GPA: termAverage.GPA!,
        });
        rank++;
      }
    }
    setTermMap(map);
  }, [termToCourseAveragesMap]);

  const numPages: number = useMemo(() => {
    if (!termMap || !termMap.has(termSelected)) {
      return 0;
    }
    return Math.ceil(termMap.get(termSelected!)!.length / rowsPerPage);
  }, [termMap, termSelected]);

  const onRowsPerPageChange: (e: any) => void = useCallback((e: any) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  useEffect(() => {
    generateRankingsMap();
  }, [generateRankingsMap]);

  const tabs: RankingsPageTab[] = useMemo(() => {
    const tabs: RankingsPageTab[] = [];
    for (const term of termMap.keys()) {
      tabs.push({
        id: term,
        label: term,
      });
    }
    tabs.sort((a, b) => {
      const [termA, yearA] = a.id.split(" ");
      const [termB, yearB] = b.id.split(" ");

      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      return termOrder[termB] - termOrder[termA];
    })
    return tabs;
  }, [termMap]);

  const finalItems: RankingsTableRow[] = useMemo(() => {
    if (!termMap || !termMap.has(termSelected)) {
      return [];
    }
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return termMap!.get(termSelected)!.slice(start, end);
  }, [termSelected, termMap, page, rowsPerPage]);
  
  return (
    <div className="w-4/5 mx-auto mt-8">
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-2 w-800">
          <h1 className="heading-md">Hardest Classes Rankings</h1>
          <p className="text-sm w-full text-gray-600">
            In order to be on the list, the class must not be a research class (course numbers 2699, 4699),
            research assistantship (course numbers 2698, 4698), thesis or dissertation writing (7000, 9000),
            recitation or lab (course numbers ending in R or L), must not be a pass/fail class, must have 
            enrolled more than three students, and must not have obtained a 100 percent withdrawal rate.
          </p>
        </div>
        <Tabs 
          aria-label="Options"
          selectedKey={termSelected}
          onSelectionChange={(key) => setTermSelected(key as string)}
          disableAnimation
          classNames={{
            tabList: "p-0"
          }}
          items={tabs}
        >
          {(item) => (
            <Tab key={item.id} title={item.label} />
          )}
        </Tabs>
        <div className="flex flex-col gap-8">
          <RankingsTable 
            rows={finalItems} 
          />
          <div className="flex flex-col gap-4 mb-24">
            <label className="flex items-center text-sm">
              Rows per page:
              <select
                className="bg-transparent outline-none text-default-400 text-small"
                onChange={onRowsPerPageChange}
                value={rowsPerPage}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
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
    </div>
  );  
}

export default RankingsPageClient;