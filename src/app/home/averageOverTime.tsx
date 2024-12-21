'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCourses } from "../contexts/course/provider";
import LineChart, { LineChartDataset, LineDataPoint } from "./lineChart";
import { getCSSVariableValue } from "../shared/donutChart";
import CloseIcon from '@mui/icons-material/Close';
import { Input } from "@nextui-org/input";
import { SearchIcon } from "../../../public/icons/searchIcon";
import { CourseAveragesByTerm, CourseInfo } from "../api/course";
import { VariableSizeList } from "react-window";
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import { Button } from "@nextui-org/button";
import { signOut } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';

export const allTerms: string[] = [
  'Fall 2010', 'Spring 2011', 'Summer 2011',
  'Fall 2011', 'Spring 2012', 'Summer 2012',
  'Fall 2012', 'Spring 2013', 'Summer 2013',
  'Fall 2013', 'Spring 2014', 'Summer 2014',
  'Fall 2014', 'Spring 2015', 'Summer 2015',
  'Fall 2015', 'Spring 2016', 'Summer 2016',
  'Fall 2016', 'Spring 2017', 'Summer 2017',
  'Fall 2017', 'Spring 2018', 'Summer 2018',
  'Fall 2018', 'Spring 2019', 'Summer 2019',
  'Fall 2019', 'Spring 2020', 'Summer 2020',
  'Fall 2020', 'Spring 2021', 'Summer 2021',
  'Fall 2021', 'Spring 2022', 'Summer 2022',
  'Fall 2022', 'Spring 2023', 'Summer 2023',
  'Fall 2023', 'Spring 2024', 'Summer 2024',
];

const colors: string[] = [
  '--color-yellow',
  '--color-dark-green',
  '--color-light-green',
  '--color-pink',
  '--color-red',
  '--color-light-blue',
  '--color-dark-blue',
];

export const termToSortableInteger: (term: string) => number = (term) => {
  const [semester, year] = term.split(' ');
  const yearNum = parseInt(year);
  const semesterNum = semester === 'Spring' ? 1 : semester === 'Summer' ? 2 : 3;
  return yearNum * 10 + semesterNum;
}

export const hexToRgba: (hex: string, opacity: number) => string = (hex, opacity) => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export interface AverageOverTimeProps {}

const AverageOverTime: FC<AverageOverTimeProps> = ({

}: AverageOverTimeProps) => {

  /** Have to transform this into a dictionary for courses -> terms -> averages */
  const { courses, averagesByTermMap } = useCourses();

  const [comparing, setComparing] = useState<string[] | null>([ 'CS 1332', 'CS 1301' ]);
  const [comparedCourseSelected, setComparedCourseSelected] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(-1);
  const [rerenderKey, setRerenderKey] = useState<number | null>(0);

  /** Initial key is course, then by term */
  const [termsDict, setTermsDict] = useState<Map<string, Map<string, CourseAveragesByTerm>> | null>(null);
  const [courseColorDict, setCourseColorDict] = useState<Map<string, string> | null>(null);
  const [colorIndex, setColorIndex] = useState<number | null>(0);
  const [query, setQuery] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    /** Initialization */
    if (!termsDict && averagesByTermMap && averagesByTermMap.size > 0) {
      const newDict = new Map();
      for (const course of comparing!) {
        newDict.set(course, new Map());
        for (const average of averagesByTermMap!.get(course)!) {
          if (!newDict.get(course).has(average.term)) {
            newDict.get(course).set(average.term, average);
          }
        }
      }
      setTermsDict(newDict);

      /** Colors */
      const newColorDict = new Map();
      let idx = 0;
      for (const course of comparing!) {
        newColorDict.set(course, colors[idx]);
        idx++;
      }
      setColorIndex(idx);
      setCourseColorDict(newColorDict);
    }
  }, [averagesByTermMap]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const removeFromTermsDict: (course: string) => void = useCallback((course) => {
    /** Terms dict has some datasets already */
    setTermsDict(prev => {
      const newDict = new Map(prev);
      newDict.delete(course);
      return newDict;
    });
    setRerenderKey(prev => prev! + 1);
    setComparedCourseSelected(null);
  }, [termsDict]);

  /**
   * Both adds to the dictionary and updates the color
   * parameters.
   */
  const addToTermsDict: (course: string) => void = useCallback((course) => {
    setTermsDict(prev => {
      const newDict = new Map(prev);
      newDict.set(course, new Map());
      for (const average of averagesByTermMap!.get(course)!) {
        if (!newDict.get(course)!.has(average.term)) {
          newDict.get(course)!.set(average.term, average);
        }
      }
      return newDict;
    });
    let idx: number | null = null;
    setCourseColorDict(prev => {
      const newDict = new Map(prev);
      idx = colorIndex;
      while (Array.from(newDict.values()).includes(colors[idx!])) {
        idx = (idx! + 1) % colors.length;
      }
      newDict.set(course, colors[idx!]);
      return newDict;
    });
    setColorIndex((idx! + 1) % colors.length);
    setRerenderKey(prev => prev! + 1);
    setIsFocused(false);
    inputRef!.current!.blur();
  }, [averagesByTermMap, colorIndex]);

  const datasets: LineChartDataset[] = useMemo(() => {
    if (!termsDict || !courseColorDict) {
      return [];
    }
    let datasets: LineChartDataset[] = [];
    termsDict.keys().forEach((course: string) => {
      let data: LineDataPoint[] = [];
      // All terms is already sorted.
      for (const term of allTerms) {
        if (!termsDict.get(course)!.has(term)) {
          continue;
        }
        let gpa: number | null = Number(termsDict.get(course)!.get(term)!.GPA?.toFixed(2));
        data.push({
          x: term,
          y: gpa!
        });
      }
      datasets.push({
        label: course,
        data: data,
      });
    });

    return datasets;
  }, [courseColorDict, termsDict, colors]);

  const coloredDatasets: LineChartDataset[] = useMemo(() => {
    let coloredDatasets: LineChartDataset[] = [...datasets];

    for (const dataset of coloredDatasets) {
      let cssVar = getCSSVariableValue(courseColorDict?.get(dataset.label)!);
      if (comparedCourseSelected) {
        dataset.borderColor = dataset.label === comparedCourseSelected ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1);
      } else {
        dataset.borderColor = cssVar;
      }
    }
    return coloredDatasets;
  }, [datasets, courseColorDict, comparedCourseSelected]);

  const activeCourse: CourseInfo | null = useMemo(() => {
    return activeIndex === -1 ? null : filteredCourses[activeIndex!];
  }, [filteredCourses, activeIndex]);

  const onSearchChange: (value: string) => void = useCallback((value: string) => {
    setQuery(value || '');
  }, []);

  const onClear: () => void = useCallback(() => {
    setQuery('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        const course = activeIndex === -1 ? filteredCourses[0] : activeCourse;
        if (termsDict && termsDict!.has(course!.id.toUpperCase())) {
          setError(`Already comparing ${course!.id}`);
          inputRef.current?.focus();
          return;
        } else if (termsDict && termsDict!.size === 7) {
          setError(`Can\'t compare more than seven courses...`);
          inputRef.current?.focus();
          return;
        }
        setComparing((prev) => [...prev!, course!.id]);
        addToTermsDict(course!.id);
        setQuery('');
        setActiveIndex(-1);
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

  const handleRowClick: () => void = useCallback(() => {
    if (termsDict && termsDict!.has(activeCourse!.id.toUpperCase())) {
      setError(`Already comparing ${activeCourse!.id}`);
      inputRef.current?.focus();
      return;
    } else if (termsDict && termsDict!.size === 7) {
      setError(`Can\'t compare more than seven courses...`);
      inputRef.current?.focus();
      return;
    }
    setComparing((prev) => [...prev!, activeCourse!.id]);
    addToTermsDict(activeCourse!.id);
    setQuery('');
    setActiveIndex(-1);
  }, [termsDict, activeCourse, addToTermsDict]);

  const Row: ({ index, style }: { index: number; style: React.CSSProperties }) => JSX.Element = useCallback(({ index, style }) => (
    <div 
      id={`row-${index}`}
      style={style}
      onMouseEnter={() => setActiveIndex(index)}
      onMouseLeave={() => setActiveIndex(-1)}
      onClick={() => handleRowClick()}
      className={`${activeIndex === index ? 'bg-gray-200' : ''} text-xs cursor-pointer pl-4 rounded-none py-1`}
    >
      {filteredCourses[index].id}
    </div>
  ), [activeIndex, setActiveIndex, filteredCourses]);

  const searchbar: React.ReactNode = useMemo(() => {
    return (
      <div className="relative">
        <div className={`relative border-b p-0 pl-4 w-200 ${isFocused ? 'border-gray-300' : 'border-gray-400'}`}>
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
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef}
              autoComplete="off"
              placeholder={`${activeCourse ? '' : 'Search for a course'}`}
              className="text-xs w-full bg-transparent z-2 px-2 py-1 outline-none border-none"
            />
          </div>
        </div>
        <div 
          className={`${isFocused ? 'visible' : 'invisible'} absolute top-full w-full z-20 bg-white w-180 rounded-b-xl py-2 shadow-md`}
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
    )
  }, [isFocused, activeCourse, filteredCourses, query, onSearchChange, onClear]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="heading-md">Compare Courses</h1>
      <div className="flex flex-row gap-2 items-center">
        <p className="text-sm text-gray-600">Course GPAs Over Time</p>
        <NextToolTip content={'Aggregated across all term data. Select or hover to interact.'}>
          <InfoIcon style={{ width: '16px' }}/>
        </NextToolTip>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center flex-wrap">
          {comparing && comparing!.map((course: string) => {
            return (
              <div 
                className="flex flex-row h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  removeFromTermsDict(course);
                  setComparing((prev) => {
                    return [...prev!.filter(element => element !== course)];
                  });
                }}
                onMouseEnter={() => {
                  setComparedCourseSelected(course);
                }}
                onMouseLeave={() => {
                  setComparedCourseSelected(null);
                }}
                key={course}
              >
                <div 
                  className="rounded-full w-3 h-3" 
                  style={{ 
                    backgroundColor: getCSSVariableValue(courseColorDict?.get(course)!),
                    border: '1px solid rgba(0,0,0,0.1)' 
                  }} 
                />
                <p className="text-xs">{course}</p>
              </div>  
            )
          })}
          {searchbar}
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
      <div className="w-800" key={rerenderKey}>
        <LineChart
          courseColorDict={courseColorDict!}
          datasets={coloredDatasets}
          datasetIndex={datasets.findIndex((dataset: LineChartDataset) => dataset.label === comparedCourseSelected)}
        />
      </div>
    </div>
  )
}

export default AverageOverTime;