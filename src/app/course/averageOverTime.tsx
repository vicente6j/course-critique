import { FC, useEffect, useMemo, useState } from "react";
import { CourseAveragesByTerm } from "../api/course";
import { useCourses } from "../server-contexts/course/provider";
import { LineChartDataset, LineDataPoint } from "../home/lineChart";
import { getClientColorFromGPA } from "../utils";
import HideSourceIcon from '@mui/icons-material/HideSource';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LineChart from "./line-chart";

export interface AverageOverTimeProps {
  courseID: string;
}

const AverageOverTime: FC<AverageOverTimeProps> = ({
  courseID,
}: AverageOverTimeProps) => {

  const [hoverShowAverageOverTime, setHoverAverageOverTime] = useState<boolean>(false);
  const [showAverageOverTime, setShowAverageOverTime] = useState<boolean>(true);
  const [termDict, setTermDict] = useState<Map<string, CourseAveragesByTerm> | null>(null);

  const { maps } = useCourses();

  /**
   * Aggregates from useCourses's courseToTermAveragesMap to create a dictionary
   * on which to index into a given term average via the term. 
   * e.g. we already know we're CS 1332, so now it's
   *  Fa24 -> {averages}, Su24 -> {averages}
   */
  useEffect(() => {
    if (!termDict) {
      const newDict: Map<string, CourseAveragesByTerm> = new Map();
      maps.courseToTermAveragesMap?.get(courseID)?.forEach((termAverage: CourseAveragesByTerm) => {
        newDict.set(termAverage.term, termAverage);
      });
      setTermDict(newDict);
    }
  }, [maps.courseToTermAveragesMap]);

  const dataset: LineChartDataset | null = useMemo(() => {
    if (!termDict || !maps.averagesMap) {
      return null;
    }
    const data: LineDataPoint[] = [];
    termDict.keys().forEach((term: string) => {
      let gpa: number | null = Number(termDict.get(term)?.GPA?.toFixed(2));
      data.push({
        x: term,
        y: gpa!,
      });
    });
    const dataset: LineChartDataset = {
      data: data,
      borderColor: getClientColorFromGPA(maps.averagesMap!.get(courseID)?.GPA!),
      label: courseID,
    };
    return dataset;
  }, [termDict, maps.averagesMap]);

  return (
    <div className="flex flex-col gap-2">
      {showAverageOverTime ? (
        <div className="flex flex-col gap-2">
          <div 
            className="flex gap-2 items-center cursor-pointer"
            onMouseEnter={() => {
              setHoverAverageOverTime(true);
            }}
            onMouseLeave={() => {
              setHoverAverageOverTime(false);
            }}
            onClick={() => {
              setShowAverageOverTime(false);
            }} 
          >
            <p className={`heading-sm ${hoverShowAverageOverTime ? 'text-red-800' : 'text-[var(--color-red)]' } cursor-pointer`}>
              Hide
            </p>
            <HideSourceIcon 
              style={{ width: '24px', color: `${hoverShowAverageOverTime ? 'var(--color-dark-red)' : 'var(--color-red)'}`  }}
              className={`transition-transform ${hoverShowAverageOverTime ? 'rotate-180' : ''}`}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="heading-sm font-regular">Averages over time</h1>
            <LineChart 
              dataset={dataset!}
            />
          </div>
        </div>
      ) : (
        <div 
          className="flex gap-2 items-center cursor-pointer"
          onMouseEnter={() => {
            setHoverAverageOverTime(true);
          }}
          onMouseLeave={() => {
            setHoverAverageOverTime(false);
          }}
          onClick={() => {
            setShowAverageOverTime(true);
          }} 
        >
          <p className={`heading-sm ${hoverShowAverageOverTime ? 'text-green-800' : 'text-[var(--color-light-green)]' } cursor-pointer`}>
            Show averages over time
          </p>
          <VisibilityIcon 
            style={{ width: '24px', color: `${hoverShowAverageOverTime ? 'var(--color-dark-green)' : 'var(--color-light-green)'}` }}
            className={`transition-transform ${hoverShowAverageOverTime ? 'rotate-180' : ''}`}
          />
        </div>
      )}
    </div>
  );
}

export default AverageOverTime;