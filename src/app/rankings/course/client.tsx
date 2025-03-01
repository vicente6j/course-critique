import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Pagination, Tab, Tabs } from "@nextui-org/react";
import BarChartIcon from '@mui/icons-material/BarChart';
import RankingsTable, { RankingsTableRow } from "../rankingsTable";
import { useCourses } from "@/app/contexts/server/course/provider";
import CustomSearchbar from "@/app/shared/customSearchbar";
import { useRankings } from "@/app/hooks/useRankings";
import { dataTerms } from "@/app/metadata";
import { Spinner } from "@heroui/spinner";
import Checkbox from "@/app/components/checkbox";
import RightHandPanel from "../rightHandPanel";

export interface RankingsPageClientProps {}

const RankingsPageCourseClient: FC<RankingsPageClientProps> = ({

}: RankingsPageClientProps) => {

  const [termSelected, setTermSelected] = useState<string>('Fall 2024');
  const [searchValue, setSearchValue] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [differentialStateChecked, setDifferentialStateChecked] = useState<boolean>(false);
  const [rankingTableRenderCount, setRankingTableRenderCount] = useState<number>(0);

  const {
    courseRankingsMap,
    loading: rankingsLoading,
    tabs
  } = useRankings();

  useEffect(() => {
    setPage(1);
  }, [termSelected]);

  useEffect(() => {
    setRankingTableRenderCount(prev => prev + 1);
  }, [differentialStateChecked]);

  const numPages: number = useMemo(() => {
    if (!courseRankingsMap || !courseRankingsMap.has(termSelected)) {
      return 0;
    }
    return Math.ceil(courseRankingsMap.get(termSelected!)!.length / rowsPerPage);
  }, [courseRankingsMap, termSelected]);

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
    if (!courseRankingsMap || !courseRankingsMap.has(termSelected)) {
      return [];
    }
    return courseRankingsMap.get(termSelected)!.filter((row) => 
      (row.course_id as string).toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, courseRankingsMap, termSelected]);

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
              In order to obtain this list, we naturally filter across all courses 
              which contain an invalid GPA, e.g. recitation sections, lab sections, 
              research, etc. Enrollment not considered.
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
                tab: "w-[120px] bg-default-100 rounded-none data-[selected=true]:rounded-lg",
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

          <div className="flex flex-row gap-4 items-center">
            <CustomSearchbar
              searchValue={searchValue}
              onClear={onClear}
              onSearchChange={onSearchChange}
              variation={'regular'}
              searchString={`Search for a course...`}
            />
            <Checkbox 
              checked={differentialStateChecked}
              setChecked={setDifferentialStateChecked}
              checkboxLabel={'Show differential'}
            />
          </div>

          <div className="flex flex-col gap-8 min-h-[600px]">
            {rankingsLoading ? (
              <Spinner />
            ) : (
              <RankingsTable 
                rows={finalItems} 
                type={'course'}
                showDifferential={differentialStateChecked}
                key={rankingTableRenderCount}
              />
            )}

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
        <RightHandPanel 
          type={'course'}
        />
      </div>
    </div>
  );  
}

export default RankingsPageCourseClient;