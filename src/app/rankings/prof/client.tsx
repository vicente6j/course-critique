import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Pagination, Tab, Tabs } from "@nextui-org/react";
import BarChartIcon from '@mui/icons-material/BarChart';
import RankingsTable, { RankingsTableRow } from "../rankingsTable";
import CustomSearchbar from "@/app/shared/customSearchbar";
import { useProfs } from "@/app/server-contexts/prof/provider";
import { useRankings } from "@/app/hooks/useRankings";
import { useCourses } from "@/app/server-contexts/course/provider";

export interface RankingsPageProfClientProps {}

const RankingsPageProfClient: FC<RankingsPageProfClientProps> = ({

}: RankingsPageProfClientProps) => {

  const [rankingsMap, setRankingsMap] = useState<Map<string, RankingsTableRow[]>>(new Map());
  const [termSelected, setTermSelected] = useState<string>('Summer 2024');
  const [searchValue, setSearchValue] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const { getSortedAveragesByTermMap, coursesTaughtByTermMap, profMap } = useProfs();
  const { tabs } = useRankings();
  const { averagesMap: courseAveragesMap } = useCourses();

  const generateRankingsMap: () => void = useCallback(() => {
    if (!coursesTaughtByTermMap) {
      return;
    }
    /** 
     * This is just a dictionary which maps term to a list of <textbf>sorted professors</textbf>
     * by GPA only.
     */
    const sortedTermsMap = getSortedAveragesByTermMap();
    const rankingsMap = new Map();

    for (const term of sortedTermsMap!.keys()) {
      rankingsMap.set(term, []);
      let rank = 1;
      for (const termAverage of sortedTermsMap!.get(term)!) {
        let courses_taught_this_sem = coursesTaughtByTermMap!.get(term)!.get(termAverage.prof_id)?.courses_taught;
        courses_taught_this_sem = courses_taught_this_sem!.filter((course) => (
          courseAveragesMap?.has(course)
        ));

        rankingsMap.get(term)!.push({
          key: termAverage.prof_id,
          rank: rank,
          prof_id: termAverage.prof_id,
          courses_taught_this_sem: courses_taught_this_sem,
          GPA: termAverage.GPA!,
        });
        rank++;
      }
    }
    setRankingsMap(rankingsMap);
  }, [getSortedAveragesByTermMap, coursesTaughtByTermMap]);

  useEffect(() => {
    generateRankingsMap();
  }, [generateRankingsMap]);

  const numPages: number = useMemo(() => {
    if (!rankingsMap || !rankingsMap.has(termSelected)) {
      return 0;
    }
    return Math.ceil(rankingsMap.get(termSelected!)!.length / rowsPerPage);
  }, [rankingsMap, termSelected, rowsPerPage]);

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
    if (!rankingsMap || !rankingsMap.has(termSelected) || !profMap) {
      return [];
    }
    return rankingsMap.get(termSelected)!.filter((row) => {
      const name = profMap!.get(row.prof_id as string)!.instructor_name;
      return name.toLowerCase().includes(searchValue.toLowerCase())
    });
  }, [searchValue, rankingsMap, termSelected, profMap]);

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
              <h1 className="heading-md">Hardest Professors Rankings</h1>
            </div>
            <p className="text-sm w-full text-gray-600">
              A small caveat here is we again filter professors based on an enrollment. i.e. a professor who teaches
              a course with less than three students won't have that course count towards his GPA (listed and sorted here).
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
            searchString={`Search for a professor...`}
          />

          <div className="flex flex-col gap-8">
            <RankingsTable 
              rows={finalItems} 
              type={'prof'}
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
      </div>
    </div>
  );  
}

export default RankingsPageProfClient;