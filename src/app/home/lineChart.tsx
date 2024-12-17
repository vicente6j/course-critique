import { ActiveElement, ChartData, ChartEvent } from "chart.js";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from "chart.js";
import { getCSSVariableValue } from "../shared/donutChart";
import { hexToRgb } from "@mui/material";
import { hexToRgba } from "./averageOverTime";

export interface LineDataPoint {
  x: string;
  y: number;
}

export interface LineChartDataset {
  label: string;
  data: LineDataPoint[];
  borderColor?: string;
}

export interface LineChartProps {
  datasets: LineChartDataset[];
  datasetIndex: number | null;
  courseColorDict: Map<string, string>;
}

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

const LineChart: FC<LineChartProps> = ({
  datasets,
  courseColorDict,
  datasetIndex,
}: LineChartProps) => {

  const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState<number | null>(datasetIndex);

  useEffect(() => {
    /** Use a use effect so that it triggers on every new invocation, rather than just sometimes */
    setHoveredDatasetIndex(datasetIndex);
  }, [datasetIndex]);

  const adjustOpacities: (index: number) => LineChartDataset[] = useCallback((index: number) => {
    return datasets.map((dataset: LineChartDataset, i: number) => {
      const cssVar = getCSSVariableValue(courseColorDict?.get(dataset.label)!);
      return {
        ...dataset,
        borderColor: i === index || index === -1 ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1)
      }
    });
  }, [datasets, courseColorDict]);

  const options: any = useMemo(() => ({
    responsive: true,
    interaction: {
      mode: 'point',
      intersect: false,
    },
    onHover: (event: ChartEvent, chartElement: ActiveElement[]) => {
      if (chartElement.length) {
        const { datasetIndex } = chartElement[0];
        if (hoveredDatasetIndex !== datasetIndex) {
          setHoveredDatasetIndex(datasetIndex);
        }
      } else {
        setHoveredDatasetIndex(datasetIndex);
      }
    },
    plugins: {
      title: {
        display: 'Grades Per Term',
        text: 'Grades Per Term',
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          labelColor: (context: { dataset: { borderColor: any; }; }) => {
            return {
              backgroundColor: context.dataset.borderColor,
            };
          },
        },
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Term'
        },
      },
      y: {
        min: 0,
        max: 4.3,
        title: {
          display: true,
          text: 'GPA',
        },
        beginAtZero: true,
        ticks: {
          stepSize: 0.5,
          values: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
          callback: function(value: number) {
            return value <= 4.0 ? value : '';
          },
        },
        grid: {
          drawBorder: false,
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          color: (context: any) => {
            return context.tick.value > 4.0 ? 'transparent' : 'rgba(0,0,0,0.1)';
          },
        }
      },
    },
  }), [adjustOpacities, hoveredDatasetIndex]);

  const finalData: ChartData<'line', LineDataPoint[]> = useMemo(() => {
    const processedDatasets = hoveredDatasetIndex !== null 
      ? adjustOpacities(hoveredDatasetIndex)
      : adjustOpacities(-1);
    
    return {
      labels: processedDatasets[0]?.data.map(point => point.x) || [],
      datasets: processedDatasets.map((dataset: LineChartDataset) => ({
        label: dataset.label,
        data: dataset.data.map(point => ({ x: point.x, y: point.y })),
        borderColor: dataset.borderColor,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        fill: false,
        tension: 0.4,
      })),
    };
  }, [datasets, hoveredDatasetIndex, adjustOpacities]);

  return (
    <div className="h-fit">
      <Line 
        data={finalData} 
        options={options} 
      />
    </div>
  );
}

export default LineChart;