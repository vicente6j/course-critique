'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { useRouter } from 'next/navigation'; 
import { VariableSizeList } from "react-window";
import { Kbd } from "@nextui-org/kbd";
import { useCourses } from "../server-contexts/course/provider";
import { useProfs } from "../server-contexts/prof/provider";
import { CourseInfo } from "../api/course";
import { ProfInfo } from "../api/prof";
import { VariableSizeListRowType } from "../shared/courseSearchbar";

export type Result = ProfInfo | CourseInfo | null;

export interface NavSearchbarProps {}

const NavSearchbar: FC<NavSearchbarProps> = ({

}: NavSearchbarProps) => {
  
  const [query, setQuery] = useState<string | null>('');
  const [activeIndex, setActiveIndex] = useState<number | null>(-1);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<VariableSizeList | null>(null);

  const { 
    data 
  } = useCourses();

  const { 
    data: profData 
  } = useProfs();
  const router = useRouter();

  const filteredCourses: CourseInfo[] = useMemo(() => {
    if (!data.courses) {
      return [];
    } else if (!query) {
      return data.courses;
    }
    return data.courses?.filter(course => (
      course.id.toLowerCase().includes(query.toLowerCase())
    ));
  }, [data.courses, query]);

  /**
   * Filters profs via obtaining tokens (split by space) and checking for presence in query string.
   */
  const filteredProfs: ProfInfo[] = useMemo(() => {
    if (!profData.profs) {
      return [];
    } else if (!query) {
      return profData.profs;
    }
    const token1 = query.includes(' ') ? query.split(' ')[0] : null;
    const token2 = query.includes(' ') ? query.split(' ')[1] : null;
    return profData.profs!.filter(prof => {
      const profName = prof.instructor_name.toLowerCase();
      const includesToken1 = (token1 && profName.includes(token1)) as boolean;
      const includesToken2 = (token2 && profName.includes(token2)) as boolean;
      return profName.includes(query.toLowerCase()) || (includesToken1 && includesToken2);
    });
  }, [profData.profs, query]);

  /**
   * Give precedence to courses, then to profs. 
   * 
   * - Within profs, gives precedence to matches which start with the query string rather than simply include it.
   */
  const compiledResults: Result[] = useMemo(() => {
    if (!query) {
      return data.courses ? data.courses!.slice(0, 3) : [];
    }
    const res: Result[] = [];
    /** Add those courses that start with query */
    for (const course of filteredCourses) {
      if (course.id.toLowerCase().startsWith(query.toLowerCase())) {
        res.push(course);
      }
    }
    /** Add those profs that start with query (lname always) */
    for (const prof of filteredProfs) {
      const profName = prof.instructor_name.toLowerCase();
      if (profName.startsWith(query.toLowerCase())) {
        res.push(prof);
      }
    }
    /** Add the rest of the results */
    for (const searchResult of [...filteredCourses, ...filteredProfs]) {
      if (!res.includes(searchResult)) {
        res.push(searchResult);
      }
    }
    return res.slice(0, 5);
  }, [data.courses, filteredCourses, filteredProfs, query]);

  const activeResult: Result = useMemo(() => {
    return activeIndex === -1 ? null : compiledResults[activeIndex!];
  }, [compiledResults, activeIndex]);

  const onSearchChange = useCallback((newQuery: string) => {
    setQuery(newQuery || '');
    setActiveIndex(-1);
  }, []);

  const isCourse: (result: Result) => boolean = useCallback((result) => {
    return result !== null && ('course_name' in result! || 'course_id' in result!);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        const immResult = activeIndex === -1 ? compiledResults[0] : compiledResults[activeIndex!];
        setIsFocused(false);
        setActiveIndex(-1);
        if (isCourse(immResult)) {
          router.push(`/course?courseID=${(immResult as CourseInfo).id}`);
        } else {
          router.push(`/prof?profID=${(immResult as ProfInfo).instructor_id}`);
        }
        setQuery('');
        break;
      case 'ArrowDown':
        setActiveIndex(prev => Math.min(prev! + 1, compiledResults.length - 1));
        break;
      case 'ArrowUp':
        setActiveIndex(prev => Math.max(prev! - 1, -1));
        break;
      default:
        return;
    }
    e.preventDefault();
  }, [compiledResults, activeIndex]);

  const handleGlobalKeyDown: (e: KeyboardEvent) => void = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true); // Reset after each re-render
    }
  }, [compiledResults]);

  const getItemSize: (index: number) => number = useCallback((index) => {
    const result = compiledResults[index]!;
    if (isCourse(result)) {
      return 40;
    }
    const prof = result as ProfInfo;
    const profName = prof.instructor_name;
    const baseSize = 40;
    const extraHeight = profName.length > 40 ? 20 : 0;
    return baseSize + extraHeight;
  }, [compiledResults, compiledResults.length]);

  const getTotalHeight: (items: any[]) => number = useCallback((items: any[]) => {
    return items.reduce((totalHeight, _, index) => totalHeight + getItemSize(index), 0);
  }, [getItemSize]);

  const handleEventClick: (index: number) => void = useCallback((index: number) => {
    const result: Result = compiledResults[index]!;
    if (isCourse(result)) {
      const courseId = (compiledResults[index] as CourseInfo).id;
      router.push(`/course?courseID=${courseId}`);
    } else {
      const instructorID = (compiledResults[index] as ProfInfo).instructor_id;
      router.push(`/prof?profID=${instructorID}`);
    }
    setQuery('');
  }, [compiledResults]);

  /**
   * Receives two props: the index of the item in the variable size list and
   * the styles calculated by VariableSizeList.
   * 
   * Recall that VariableSizeList is really good for virtualization purposes
   * (only rendering what's on the page).
   * @param param0 
   * @returns 
   */
  const Row: ({ 
    index, 
    style 
  }: VariableSizeListRowType) => JSX.Element = useCallback(({ 
    index, 
    style 
  }) => (
    <div 
      style={style}
      onClick={() => {
        handleEventClick(index);
        setActiveIndex(-1);
        setIsFocused(false);
      }}
      onMouseEnter={() => setActiveIndex(index)}
      onMouseLeave={() => setActiveIndex(-1)}
      className={`${activeIndex == index && 'bg-gray-200'} text-sm cursor-pointer py-2 px-4 rounded-none`}
    >
      {isCourse(compiledResults[index]!) ? (
        (compiledResults[index] as CourseInfo).id
      ) : (
        (compiledResults[index] as ProfInfo).instructor_name
      )}
    </div>
  ), [handleEventClick, compiledResults, activeIndex]);

  return (
    <div className="relative flex flex-col justify-center gap-0 w-320">
      <div className="relative bg-gray-100 p-0 pl-4 rounded-lg w-320 max-h-xs">
        {activeResult && (
          <div className="absolute t-0 l-0 ml-3 p-2 z-10 text-search">
            <span className="opacity-0">{query}</span>
            {isCourse(activeResult) ? (
              <span className="text-gray-600">
                {(activeResult as CourseInfo).id.slice(query?.length || 0).toLowerCase()}
              </span>
            ) : query && (activeResult as ProfInfo).instructor_name.toLowerCase().startsWith(query) && (
              <span className="text-gray-600">
                {(activeResult as ProfInfo).instructor_name.slice(query?.length || 0).toLowerCase()}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-row gap-0 items-center w-full">
          <SearchIcon />
          <input
            id="searchbar"
            type="text"
            value={query ? query : ''}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            onMouseDown={() => {
              inputRef.current?.focus();
            }}
            autoComplete="off"
            placeholder={`${activeResult ? '' : 'Search for a course or professor'}`}
            className="text-search w-full bg-transparent z-2 p-2 outline-none border-none rounded"
          />
          <Kbd 
            keys={["command"]}
            className="opacity-50 shadow-none pr-4"
          >
            K
          </Kbd>
        </div>
      </div>
      <div 
        className={`${isFocused ? 'visible' : 'invisible'} absolute top-full w-full z-20 bg-white w-300 rounded-b-xl py-2 shadow-md`}
        onMouseDown={(e) => {
          e.preventDefault(); /** Extremely important to not unblur before selecting */
        }}
      >
        <VariableSizeList
          ref={listRef}
          height={getTotalHeight(compiledResults)}
          width="max-w-xs"
          itemCount={compiledResults.length}
          itemSize={getItemSize}
        >
          {Row}
        </VariableSizeList>
      </div>
    </div>
  );
}

export default NavSearchbar;