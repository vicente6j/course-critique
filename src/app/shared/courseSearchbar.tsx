import { FC, useCallback, useMemo, useRef, useState } from "react";
import { CourseInfo } from "../api/course";
import { useCourses } from "../server-contexts/course/provider";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { VariableSizeList } from "react-window";

/**
 * Define some additional logic for handling the 'enter' press,
 * or selecting a row. e.g. if you invoke this component, you
 * probably don't want to just reset the query. You probably intended
 * on adding the elected course into some map or array, etc.
 */
export interface CourseSearchbarProps {
  handleKeyDownAdditional: (course: CourseInfo | null) => void;
  handleRowClickAdditional: (course: CourseInfo | null) => void;
}

const CourseSearchbar: FC<CourseSearchbarProps> = ({
  handleRowClickAdditional,
  handleKeyDownAdditional,
}: CourseSearchbarProps) => {

  const { courses } = useCourses();

  const [query, setQuery] = useState<string | null>(null);
  /**
   * Index within the variable ref list.
   */
  const [activeIndex, setActiveIndex] = useState<number | null>(-1);
  /**
   * Determines whether to show the dropdown variable ref list.
   */
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredCourses: CourseInfo[] = useMemo(() => {
    if (!courses) {
      return [];
    } else if (!query) {
      return courses.slice(0, 3);
    }
    /** First five courses to match prefix */
    return courses?.filter(course => {
      return course.id.toLowerCase().startsWith(query.toLowerCase())
    }).slice(0, 5);
  }, [courses, query]);

  const activeCourse: CourseInfo | null = useMemo(() => {
    return activeIndex === -1 ? null : filteredCourses[activeIndex!];
  }, [filteredCourses, activeIndex]);

  const onSearchChange: (value: string) => void = useCallback((value: string) => {
    setQuery(value || '');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        const course = activeIndex === -1 ? filteredCourses[0] : activeCourse;
        handleKeyDownAdditional(course);
        inputRef.current?.focus();
        setQuery('');
        setActiveIndex(-1);
        setIsFocused(false);
        break;
      case 'ArrowDown':
        setActiveIndex(prev => Math.min(prev! + 1, filteredCourses.length - 1));
        break;
      case 'ArrowUp':
        setActiveIndex(prev => Math.max(prev! - 1, -1));
        break;
      default:
        return;
    }
    e.preventDefault();
  }, [filteredCourses, activeCourse, activeIndex]);

  const Row: ({ index, style }: { index: number; style: React.CSSProperties }) => JSX.Element = useCallback(({ index, style }) => (
    <div 
      id={`row-${index}`}
      style={style}
      onMouseEnter={() => setActiveIndex(index)}
      onMouseLeave={() => setActiveIndex(-1)}
      onClick={() => {
        handleRowClickAdditional(filteredCourses[index]);
        setQuery('');
        setActiveIndex(-1);
        inputRef.current?.focus();
        setIsFocused(false);
      }}
      className={`${activeIndex === index ? 'bg-gray-200' : ''} text-xs cursor-pointer pl-4 rounded-none py-1`}
    >
      {filteredCourses[index].id}
    </div>
  ), [activeIndex, setActiveIndex, filteredCourses]);
  
  return (
    <div className="relative max-w-lg">
      <div className={`relative border-b p-0 pl-4 ${isFocused ? 'border-gray-300' : 'border-gray-400'}`}>
        {activeCourse && (
          <div className="text-xs absolute t-0 l-0 ml-3.5 px-2 py-1 z-10">
            <span className="opacity-0">{query?.toUpperCase()}</span>
            <span className="text-gray-600">{activeCourse.id.slice(query?.length || 0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex flex-row gap-0 items-center w-full">
          <SearchIcon />
          <input
            id="searchbar"
            type="text"
            value={query ? query.toUpperCase() : ''}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={() => {
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            ref={inputRef}
            autoComplete="off"
            placeholder={`${activeCourse ? '' : 'Search for a course'}`}
            className="text-xs w-full bg-transparent z-2 px-2 py-1 outline-none border-none"
          />
        </div>
      </div>
      <div 
        className={`${isFocused ? 'visible' : 'invisible'} absolute top-full z-20 bg-white w-[90%] rounded-b-xl py-2 shadow-md`}
        ref={dropdownRef}
        onMouseDown={(e) => {
          e.preventDefault(); /** Extremely important to not unblur before selecting */
        }}
      >
        <VariableSizeList
          height={30 * filteredCourses.length}
          width="max-w-xs"
          itemCount={filteredCourses.length}
          itemSize={(index) => 30}
        >
          {Row}
        </VariableSizeList>
      </div>
    </div>
  );
}

export default CourseSearchbar;