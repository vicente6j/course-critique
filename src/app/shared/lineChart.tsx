import { ActiveElement, ChartData, ChartEvent } from "chart.js";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from "chart.js";
import { getCSSVariableValue } from "./donutChart";
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
  courseColorDict: Map<string, string>;
}

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

const LineChart: FC<LineChartProps> = ({
  datasets,
  courseColorDict
}: LineChartProps) => {

  const [myDatasets, setMyDatasets] = useState<LineChartDataset[] | null>(datasets);
  const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState<number | null>(null);
  const [alreadyAdjusted, setAlreadyAdjusted] = useState<boolean>(false);

  useEffect(() => {
    if (datasets.length === 0) {
      return;
    }
    setMyDatasets(datasets);
  }, [datasets]);

  const adjustOpacities: (index: number) => void = useCallback((index: number) => {
    let newColoredDatasets: LineChartDataset[] = [...datasets];
    for (let i = 0; i < newColoredDatasets.length; i++) {
      let cssVar = getCSSVariableValue(courseColorDict?.get(newColoredDatasets[i].label)!);
      if (i === index || index === -1) {
        newColoredDatasets[i].borderColor = hexToRgba(cssVar, 1);
      } else {
        newColoredDatasets[i].borderColor = hexToRgba(cssVar, 0.1);
      }
    }
    setMyDatasets(newColoredDatasets);
  }, [datasets, courseColorDict]);

  const options: any = useMemo(() => ({
    responsive: true,
    interaction: {
      mode: 'point',
      intersect: false,
    },
    onHover: (event: ChartEvent, chartElement: ActiveElement[]) => {
      if (chartElement.length) {
        setAlreadyAdjusted(false);
        const { datasetIndex } = chartElement[0];
        if (hoveredDatasetIndex !== datasetIndex) {
          adjustOpacities(datasetIndex);
          setHoveredDatasetIndex(datasetIndex);
        }
      } else {
        if (alreadyAdjusted) {
          return;
        }
        adjustOpacities(-1);
        setHoveredDatasetIndex(null);
        setAlreadyAdjusted(true);
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
        }
      },
      y: {
        min: 0,
        max: 4,
        title: {
          display: true,
          text: 'GPA',
        },
        beginAtZero: true,
      },
    },
  }), [adjustOpacities, hoveredDatasetIndex, alreadyAdjusted]);

  const finalData: ChartData<'line', LineDataPoint[]> = useMemo(() => ({
    labels: myDatasets![0]?.data.map(point => point.x) || [],
    datasets: myDatasets!.map((dataset: LineChartDataset) => ({
      label: dataset.label,
      data: dataset.data.map(point => ({ x: point.x, y: point.y })),
      borderColor: dataset.borderColor,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      fill: false,
      tension: 0.4,
    })),
  }), [myDatasets]);

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