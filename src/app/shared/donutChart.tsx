'use client'
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { GradeTableRow } from "./gradeTable";
import { CompiledResponse, CourseHistory, movingAverages } from "../course/fetch";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { CompiledProfResponse, ProfHistory } from "../prof/fetch";
import { getClientColorFromGPA } from "../utils";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface PieSectionData {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
  dataVisibility: boolean[];
}

export interface PieSection {
  label: string;
  value: number;
  color: string;
  cutout: number;
}

export interface DonutChartProps {
  /** Assuming that each of these is the same size, for each entry in the pie chart */
  pieSections: PieSection[];
  centerText?: string;
  tooltipText?: string;
}

const DonutChart: FC<DonutChartProps> = ({
  pieSections,
  centerText,
  tooltipText,
}: DonutChartProps) => {

  useEffect(() => {
    ChartJS.unregister({ 
      id: 'centerText' 
    });
    if (centerText) {
      ChartJS.register({
        id: 'centerText',
        beforeDraw: (chart) => {
          const { width, height, ctx } = chart;
          ctx.restore();
      
          const fontSize = (height / 100).toFixed(2);
          const fontWeight = 500;
          const fontColor = getClientColorFromGPA(Number(centerText));

          ctx.font = `${fontWeight} ${fontSize}em sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = fontColor;
          
          const textX = Math.round((width - ctx.measureText(centerText).width) / 2);
          const textY = height / 2;
      
          ctx.fillText(centerText, textX, textY);
          ctx.save();
        }
      });
    }
    return () => {
      ChartJS.unregister({ 
        id: 'centerText' 
      });
    };
  }, [centerText]);

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
      cutout: pieSections.map((item) => `${item.cutout}%`),
    }
  }, [pieSections]);

  const finalData: ChartData<'doughnut', number[], string> = useMemo(() => {
    return {
      labels: pieSections.map(item => item.label),
      datasets: [{
        data: pieSections.map(item => Math.round(item.value * 100) / 100),
        backgroundColor: pieSections.map(item => item.color),
        borderColor: pieSections.map(item => item.color),
        borderWidth: 1,
      }]
    };
  }, [pieSections]);

  return (
    <div className="h-fit">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="heading-sm">
            Overall GPA
          </h1>
          <div className="relative">
            <NextToolTip content={tooltipText}>
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