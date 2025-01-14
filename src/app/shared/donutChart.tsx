'use client'
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { GradeTableRow } from "./gradeTable";
import { CompiledResponse, CourseHistory, movingAverages } from "../course/fetch";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { CompiledProfResponse, ProfHistory } from "../prof/fetch";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface PieSection {
  label: string;
  value: number;
  color: string;
  cutout: string;
}

export interface PieChartData {
  labels: string[];
  datasets: PieSectionData;
}

export interface PieSectionData {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
  dataVisibility: boolean[];
}

export const resolvedColors: Record<string, string> = {
  'A': '#168921',
  'B': '#11AF22',
  'C': '#FCB400',
  'D': '#FF9999',
  'F': '#FE466C',
  'W': '#666666',
};

/**
 * GPA comes in the form of a sliding 0.0 - 4.0 scale,
 * and hence it doesn't make sense to use 'resolvedColors'
 * (we could also just Math.float() here but it probably doesn't
 * matter).
 * @param gpa sliding 0.0 to 4.0 scale double
 * @returns color
 */
export const getClientColorFromGPA: (gpa: number) => string = (gpa: number) => {
  let color: string = '#168921';
  if (gpa > 3.0 && gpa <= 3.5) {
    color = '#11AF22';
  } else if (gpa > 2.5 && gpa <= 3.0) {
    color = '#FCB400';
  } else if (gpa <= 2.5) {
    color = '#FE466C';
  }
  return color;
};

export interface DonutChartProps {
  aggregateRow: GradeTableRow;
  history?: CourseHistory | ProfHistory | null;
  compiledResponse?: CompiledResponse | CompiledProfResponse | null;
  fetchLoading?: boolean;
  forTerm: boolean;
}

const DonutChart: FC<DonutChartProps> = ({
  aggregateRow,
  history,
  compiledResponse,
  fetchLoading,
  forTerm,
}: DonutChartProps) => {

  useEffect(() => {
    console.log(aggregateRow);

    ChartJS.unregister({ id: 'centerText' });
    if (aggregateRow.GPA !== undefined) {
      ChartJS.register({
        id: 'centerText',
        beforeDraw: (chart) => {
          const { width, height, ctx } = chart;
          ctx.restore();
      
          const fontSize = (height / 100).toFixed(2);
          const fontWeight = 500;
          const fontColor = getClientColorFromGPA(aggregateRow.GPA as number);

          ctx.font = `${fontWeight} ${fontSize}em sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = fontColor;
      
          const text = (aggregateRow.GPA as number).toFixed(2);
          const textX = Math.round((width - ctx.measureText(text).width) / 2);
          const textY = height / 2;
      
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      });
    }
    return () => {
      ChartJS.unregister({ id: 'centerText' });
    };
  }, [aggregateRow.GPA]);

  const data: PieSection[] = useMemo(() => {
    let sections: PieSection[] = [];
    for (const grade of movingAverages) {
      if (grade == 'GPA') {
        continue;
      }
      sections.push({
        label: grade as string,
        value: aggregateRow[grade] as number,
        color: resolvedColors[grade],
        cutout: '80%',
      });
    }
    return sections;
  }, [aggregateRow.GPA, aggregateRow.A, aggregateRow.B, aggregateRow.C, aggregateRow.D, aggregateRow.F, aggregateRow.W]);

  const options: any = useMemo(() => {
    return {
      maintainAspectRatio: false,
      plugins: {
        centerText: true,
        legend: {
          display: false, 
          position: 'right', 
          labels: {
            fontSize: 12,
            boxWidth: 12, 
            padding: 20, 
          },
        }
      },
      cutout: data.map((item: PieSection) => item.cutout),
    }
  }, [data]);

  const finalData: ChartData<'doughnut', number[], string> = useMemo(() => {
    return {
      labels: data.map((item: PieSection) => item.label),
      datasets: [{
        data: data.map((item: PieSection) => Math.round(item.value * 100) / 100),
        backgroundColor: data.map((item: PieSection) => item.color),
        borderColor: data.map((item: PieSection) => item.color),
        borderWidth: 1,
      }]
    };
  }, [data]);

  const nextToolTipDisplayContent: string = 
    forTerm /** assume fetch isn't loading here. */
    ? `Grades computed from ${aggregateRow.enrollment!} students` 
    : `Grades computed from ${`${fetchLoading ? '[loading...]' : history?.terms.length }`} 
      terms and ${`${fetchLoading ? '[loading...]' : Math.round(compiledResponse?.total_enrollment!) }`} students`;

  return (
    <div className="h-fit">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="heading-sm">
            Overall GPA
          </h1>
          <div className="relative">
            <NextToolTip content={nextToolTipDisplayContent}>
              <InfoIcon style={{ width: '20px' }} />
            </NextToolTip>
          </div>
        </div>
        <div className="h-100 w-120">
          <Doughnut 
            data={finalData} 
            options={options}
          />
        </div>
      </div>
    </div>
  )
}

export default DonutChart;