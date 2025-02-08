'use client'

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useCourses } from "../server-contexts/course/provider";
import LineChart, { LineChartDataset, LineDataPoint } from "./lineChart";
import { CourseAveragesByTerm, CourseInfo } from "../api/course";
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import { dataTerms, GRADE_COLORS } from "../metadata";
import { Skeleton } from "@nextui-org/skeleton";
import CourseSearchbar from "../shared/courseSearchbar";
import CorrelationMatrix, { CustomCorrelationDataset } from "./correlationMatrix";
import HideSourceIcon from '@mui/icons-material/HideSource';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { hexToRgba } from "../utils";
import ShowDontShow from "../components/showDontShow";

export interface AverageOverTimeProps {}

const AverageOverTime: FC<AverageOverTimeProps> = ({

}: AverageOverTimeProps) => {

  const [comparing, setComparing] = useState<string[] | null>([ 'ALL' ]);

  /**
   * Equivalent to the course which is currently being hovered on.
   */
  const [comparedCourseSelected, setComparedCourseSelected] = useState<string | null>(null);
  const [rerenderKey, setRerenderKey] = useState<number | null>(0);

  /**
   * Maps course to term and then to a vector of statistics held in a CourseAverageByTerm object
   * (GPA, A, B, total number of students, etc.). This is how the graph is represented as a moving
   * average.
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

  const { 
    maps, 
    loading: courseInfoLoading 
  } = useCourses();

  const courseToTermAveragesMap: Map<string, CourseAveragesByTerm[]> | null = useMemo(() => {
    return maps.courseToTermAveragesMap;
  }, [maps.courseToTermAveragesMap]);

  useEffect(() => {
    /** Initialization */
    if (!termsDict && courseToTermAveragesMap && courseToTermAveragesMap.size > 0) {
      const termDict = new Map();
      comparing?.forEach(course => {
        termDict.set(course, new Map());
        for (const average of courseToTermAveragesMap!.get(course)!) {
          if (!termDict.get(course).has(average.term)) {
            termDict.get(course).set(average.term, average);
          }
        }
      });
      setTermsDict(termDict);

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
   * Both adds to the dictionary and updates the color parameters.
   * @param course course to add
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
      for (const term of dataTerms) {
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
    const coloredDatasets: LineChartDataset[] = [...datasets];

    coloredDatasets.forEach(dataset => {
      const cssVar = courseColorDict?.get(dataset.label)!;
      if (comparedCourseSelected) {
        dataset.borderColor = dataset.label === comparedCourseSelected ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1);
      } else {
        dataset.borderColor = cssVar;
      }
    });
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

  /**
   * For all of the courses you're currently comparing, (and by extension, those
   * courses which live in termsDict.keys(), generate an array from all of your
   * term dictionaries, e.g. CS 1332 -> [{Fa24: {averages}}, {Su24: {averages}}]).
   */
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

  const courseBubble: (course: string) => React.ReactNode | null = useCallback((course) => {
    if (!termsDict) {
      return null;
    }

    if (course === 'ALL') {
      return (
        <div 
          className="flex flex-row h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center hover:bg-gray-200 cursor-pointer"
          onClick={() => {
            if (termsDict.has('ALL')) {
              removeFromTermsDict('ALL');
            } else {
              addToTermsDict('ALL');
            }
          }}
          onMouseEnter={() => {
            setComparedCourseSelected('ALL');
          }}
          onMouseLeave={() => {
            setComparedCourseSelected(null);
          }}
          key={course}
        >
          <div 
            className="rounded-full w-3 h-3" 
            style={{ 
              backgroundColor: courseColorDict?.get(course) || '#666',
              border: '1px solid rgba(0,0,0,0.1)' 
            }} 
          />
          <p className="text-xs">{'GT Average'}</p>
        </div>  
      );
    }

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
            backgroundColor: courseColorDict?.get(course)!,
            border: '1px solid rgba(0,0,0,0.1)' 
          }} 
        />
        <p className="text-xs">{course || ''}</p>
      </div>  
    );
  }, [removeFromTermsDict, courseColorDict, termsDict]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="heading-md">Compare Courses</h1>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center flex-wrap">
          {comparing && comparing!.map((course: string) => {
            return (
              <Skeleton 
                isLoaded={!courseInfoLoading}
                key={course}
              >
                {courseBubble(course)}
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
      <ShowDontShow 
        showText="Show misc statistics"
        hideText="Hide misc statistics"
        whatToShow={
          <CorrelationMatrix
            customDatasets={customCorrelationDatasets}
          />
        }
      />
      <Skeleton 
        isLoaded={!courseInfoLoading}
        className="w-900"
      >
        <div 
          className="w-900 h-400" 
          key={rerenderKey}
        >
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