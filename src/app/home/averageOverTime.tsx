'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCourses } from "../server-contexts/course/provider";
import LineChart, { LineChartDataset, LineDataPoint } from "./lineChart";
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
import { GRADE_COLORS } from "../metadata";
import { Skeleton } from "@nextui-org/skeleton";
import CourseSearchbar from "../shared/courseSearchbar";
import CorrelationMatrix, { CorrelationDataset, CustomCorrelationDataset } from "./correlationMatrix";
import HideSourceIcon from '@mui/icons-material/HideSource';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

export const allTerms: string[] = [
  'Spring 2010', 'Summer 2010',
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
  const { courseToTermAveragesMap, loading: courseInfoLoading } = useCourses();

  const [comparing, setComparing] = useState<string[] | null>([ 'CS 1332', 'CS 1301' ]);
  /**
   * Equivalent to the course which is currently being hovered on.
   */
  const [comparedCourseSelected, setComparedCourseSelected] = useState<string | null>(null);
  const [rerenderKey, setRerenderKey] = useState<number | null>(0);

  /**
   * Maps term to course and then to a vector of statistics held in a CourseAverageByTerm object
   * (GPA, A, B, total number of students, etc.)
   */
  const [termsDict, setTermsDict] = useState<Map<string, Map<string, CourseAveragesByTerm>> | null>(null);
  /**
   * Simply intended to track course -> real hex value iterating through a const called GRADE_COLORS
   * in metadata.ts.
   */
  const [courseColorDict, setCourseColorDict] = useState<Map<string, string> | null>(null);
  const [colorIndex, setColorIndex] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState<boolean>(false);
  const [hoverShowCorrelation, setHoverShowCorrelation] = useState<boolean>(false);

  useEffect(() => {
    /** Initialization */
    if (!termsDict && courseToTermAveragesMap && courseToTermAveragesMap.size > 0) {
      const newDict = new Map();
      for (const course of comparing!) {
        newDict.set(course, new Map());
        for (const average of courseToTermAveragesMap!.get(course)!) {
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
        newColorDict.set(course, GRADE_COLORS[idx]);
        idx++;
      }
      setColorIndex(idx);
      setCourseColorDict(newColorDict);
    }
  }, [courseToTermAveragesMap]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      for (const average of courseToTermAveragesMap!.get(course)!) {
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
      while (Array.from(newDict.values()).includes(GRADE_COLORS[idx!])) {
        idx = (idx! + 1) % GRADE_COLORS.length;
      }
      newDict.set(course, GRADE_COLORS[idx!]);
      return newDict;
    });
    setColorIndex((idx! + 1) % GRADE_COLORS.length);
    setRerenderKey(prev => prev! + 1);
  }, [courseToTermAveragesMap, colorIndex]);

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
  }, [courseColorDict, termsDict]);

  const coloredDatasets: LineChartDataset[] = useMemo(() => {
    let coloredDatasets: LineChartDataset[] = [...datasets];

    for (const dataset of coloredDatasets) {
      let cssVar = courseColorDict?.get(dataset.label)!;
      if (comparedCourseSelected) {
        dataset.borderColor = dataset.label === comparedCourseSelected ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1);
      } else {
        dataset.borderColor = cssVar;
      }
    }
    return coloredDatasets;
  }, [datasets, courseColorDict, comparedCourseSelected]);

  const handleKeyDown: (course: CourseInfo | null) => void = useCallback((course) => {
    if (termsDict && termsDict!.has(course!.id.toUpperCase())) {
      setError(`Already comparing ${course!.id}`);
      return;
    } else if (termsDict && termsDict!.size === 7) {
      setError(`Can\'t compare more than seven courses...`);
      return;
    }
    setComparing((prev) => [...prev!, course!.id]);
    addToTermsDict(course!.id);
  }, [termsDict]);

  const handleRowClick: (course: CourseInfo | null) => void = useCallback((course) => {
    if (termsDict && termsDict!.has(course!.id.toUpperCase())) {
      setError(`Already comparing ${course!.id}`);
      return;
    } else if (termsDict && termsDict!.size === 7) {
      setError(`Can\'t compare more than seven courses...`);
      return;
    }
    setComparing((prev) => [...prev!, course!.id]);
    addToTermsDict(course!.id);
  }, [termsDict, addToTermsDict]);

  const customCorrelationDatasets: CustomCorrelationDataset[] = useMemo(() => {
    if (!termsDict) {
      return [];
    }
    const courses = Array.from(termsDict?.keys() ?? []);
    const vectors: CourseAveragesByTerm[][] = courses.map(course => (
      Array.from(termsDict.get(course)?.values()!)
    ));

    const datasets: CustomCorrelationDataset[] = [];
    vectors.forEach((vector, idx) => {
      datasets.push({
        name: courses[idx],
        vector: vector,
      });
    });
    return datasets;
  }, [termsDict]);

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
              <Skeleton 
                isLoaded={!courseInfoLoading}
                key={course}
              >
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
                      backgroundColor: courseColorDict?.get(course)!,
                      border: '1px solid rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <p className="text-xs">{course || ''}</p>
                </div>  
              </Skeleton>
            )
          })}
          <CourseSearchbar
            handleKeyDownAdditional={handleKeyDown}
            handleRowClickAdditional={handleRowClick}
          />
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
      {showCorrelationMatrix ? (
        <div>
          <div 
            className="flex gap-2 items-center cursor-pointer w-fit"
            onMouseEnter={() => {
              setHoverShowCorrelation(true);
            }}
            onMouseLeave={() => {
              setHoverShowCorrelation(false);
            }}
            onClick={() => {
              setShowCorrelationMatrix(false);
            }} 
          >
            <p className={`heading-sm ${hoverShowCorrelation ? 'text-red-800' : 'text-[var(--color-red)]' } cursor-pointer`}>
              Hide correlation matrix
            </p>
            <HideSourceIcon 
              style={{ 
                width: '24px', 
                color: `${hoverShowCorrelation ? 'var(--color-dark-red)' : 'var(--color-red)'}`,
                transition: 'transform 0.2s' 
              }}
              className={`${hoverShowCorrelation ? 'rotate-180' : ''}`}
            />
          </div>
          <CorrelationMatrix
            customDatasets={customCorrelationDatasets}
          />
        </div>
      ) : (
        <div 
          className="flex gap-2 items-center cursor-pointer w-fit"
          onMouseEnter={() => {
            setHoverShowCorrelation(true);
          }}
          onMouseLeave={() => {
            setHoverShowCorrelation(false);
          }}
          onClick={() => {
            setShowCorrelationMatrix(true);
          }} 
        >
          <p className={`heading-xs ${hoverShowCorrelation ? 'text-gray-400' : 'text-gray-700' } cursor-pointer`}>
            Show correlation matrix
          </p>
          <ViewModuleIcon 
            style={{ 
              width: '20px', 
              color: `${hoverShowCorrelation ? hexToRgba('#9ca3af', 1) : '#374151'}`,
              transition: 'transform 0.2s' 
            }}
            className={`${hoverShowCorrelation ? 'rotate-180' : ''}`}
          />
        </div>
      )}
      <Skeleton 
        isLoaded={!courseInfoLoading}
        className="w-900"
      >
        <div className="w-900 h-400" key={rerenderKey}>
          <LineChart
            courseColorDict={courseColorDict!}
            datasets={coloredDatasets}
            datasetIndex={datasets.findIndex((dataset: LineChartDataset) => dataset.label === comparedCourseSelected)}
          />
        </div>
      </Skeleton>
    </div>
  )
}

export default AverageOverTime;