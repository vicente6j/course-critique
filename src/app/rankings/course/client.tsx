import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Pagination, Tab, Tabs } from "@nextui-org/react";
import BarChartIcon from '@mui/icons-material/BarChart';
import RankingsTable, { RankingsTableRow } from "../rankingsTable";
import { useCourses } from "@/app/server-contexts/course/provider";
import CustomSearchbar from "@/app/shared/customSearchbar";
import RightHandPanel from "./rightHandPanel";
import { useRankings } from "@/app/hooks/useRankings";

export interface RankingsPageClientProps {}

const RankingsPageCourseClient: FC<RankingsPageClientProps> = ({

}: RankingsPageClientProps) => {

  const [termMap, setTermMap] = useState<Map<string, RankingsTableRow[]>>(new Map());
  const [termSelected, setTermSelected] = useState<string>('Fall 2024');
  const [searchValue, setSearchValue] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const { getSortedAveragesByTermMap, maps } = useCourses();
  const { tabs } = useRankings();

  const generateRankingsMap: () => void = useCallback(() => {
    const sortedTermsMap = getSortedAveragesByTermMap();
    const map = new Map();
    for (const term of sortedTermsMap!.keys()) {
      map.set(term, []);
      let rank = 1;
      for (const termAverage of sortedTermsMap!.get(term)!) {
        map.get(term)!.push({
          key: termAverage.course_id,
          rank: rank,
          course_id: termAverage.course_id,
          course_name: maps.courseMap!.get(termAverage.course_id)?.course_name || 'Unknown course',
          GPA: termAverage.GPA!,
        });
        rank++;
      }
    }
    setTermMap(map);
  }, [getSortedAveragesByTermMap]);

  useEffect(() => {
    generateRankingsMap();
  }, [generateRankingsMap]);

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

  const onSearchChange: (value: string) => void = useCallback((value) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const onClear: () => void = useCallback(() => {
    setSearchValue("");
    setPage(1);
  }, []);

  const filteredItems: RankingsTableRow[] = useMemo(() => {
    if (!termMap || !termMap.has(termSelected)) {
      return [];
    }
    return termMap.get(termSelected)!.filter((row) => 
      (row.course_id as string).toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, termMap, termSelected]);

  const finalItems: RankingsTableRow[] = useMemo(() => {
    if (!filteredItems) {
      return [];
    }
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems!.slice(start, end);
  }, [filteredItems, page, rowsPerPage]);
  
  return (
    <div className="w-4/5 mx-auto mt-8">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col gap-6 w-[60%]">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
              <BarChartIcon 
                style={{
                  width: '28px',
                }}
              />
              <h1 className="heading-md">Hardest Classes Rankings</h1>
            </div>
            <p className="text-sm w-full text-gray-600">
              In order to be on the list, the class must have enrolled more than three students
              and (naturally) have had a non-null GPA.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Tabs 
              aria-label="Options"
              selectedKey={termSelected}
              onSelectionChange={(key) => {
                setTermSelected(key as string);
              }}
              disableAnimation
              classNames={{
                tabList: "flex flex-row flex-wrap gap-0 bg-transparent items-center scrollbar-hide rounded-none p-0",
                tab: "w-fit bg-default-100 rounded-none data-[selected=true]:rounded-lg",
              }}
              items={showAll 
                ? [...tabs] 
                : [...tabs.slice(0, 5)]
              }
            >
              {(item) => (
                <Tab 
                  key={item.id} 
                  title={item.label}
                />
              )}
            </Tabs>
            <p 
              className="text-sm px-0 py-1 cursor-pointer text-blue-400 hover:text-blue-700 w-fit"
              onClick={() => {
                setShowAll(!showAll);
              }}
            >
              {showAll ? 'Show less' : 'Show more'}
            </p>
          </div>

          <CustomSearchbar
            searchValue={searchValue}
            onClear={onClear}
            onSearchChange={onSearchChange}
            variation={'regular'}
            searchString={`Search for a course...`}
          />

          <div className="flex flex-col gap-8">
            <RankingsTable 
              rows={finalItems} 
              type={'course'}
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
                disableAnimation
                variant="bordered"
                isCompact
                showControls
                showShadow
                color="default"
                page={page}
                total={numPages}
                onChange={(page) => setPage(page)}
                classNames={{
                  item: 'data-[active=true]:bg-default-100 border-none'
                }}
              />
            </div>
          </div>
        </div>
        <RightHandPanel />
      </div>
    </div>
  );  
}

export default RankingsPageCourseClient;