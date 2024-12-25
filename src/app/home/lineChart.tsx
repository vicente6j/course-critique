'use client'
import { ActiveElement, ChartData, ChartEvent } from "chart.js";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from "chart.js";
import { hexToRgb } from "@mui/material";
import { allTerms, hexToRgba, termToSortableInteger } from "./averageOverTime";
import { useCourses } from "../contexts/course/provider";

export interface LineDataPoint {
  x: string;
  y: number | null; 
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

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, annotationPlugin);

const LineChart: FC<LineChartProps> = ({
  datasets,
  courseColorDict,
  datasetIndex,
}: LineChartProps) => {

  const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState<number | null>(datasetIndex);

  const { averagesMap } = useCourses();

  useEffect(() => {
    /** Use a use effect so that it triggers on every new invocation, rather than just sometimes */
    setHoveredDatasetIndex(datasetIndex);
  }, [datasetIndex]);

  const adjustOpacities: (index: number) => LineChartDataset[] = useCallback((index: number) => {
    return datasets.map((dataset: LineChartDataset, i: number) => {
      const cssVar = courseColorDict?.get(dataset.label)!;
      return {
        ...dataset,
        borderColor: i === index || index === -1 ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1)
      }
    });
  }, [datasets, courseColorDict]);

  const options: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'point',
      intersect: false,
    },
    layout: {
      padding: {
        right: 80
      }
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
        display: '',
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
      },
      annotation: {
        clip: false,  // Extremely important to allow drawing outside chart area
        annotations: [
          ...(hoveredDatasetIndex !== null && hoveredDatasetIndex !== -1 && datasets 
            ? [{
                type: 'label',
                xValue: allTerms[allTerms.length - 1],
                yValue: averagesMap?.get(datasets[hoveredDatasetIndex]?.label)?.GPA,
                backgroundColor: 'transparent',
                color: '#666',
                content: `Avg: ${averagesMap?.get(datasets[hoveredDatasetIndex]?.label)?.GPA?.toFixed(2)}`,
                position: 'right',
                xAdjust: 45,
                font: {
                  size: 12
                }
              }]
            : []),
          ...datasets.map((dataset: LineChartDataset, idx: number) => {
            const cssVar = courseColorDict?.get(dataset.label)!;
            return {
              type: 'label',
              xValue: allTerms[allTerms.length - 1],
              yValue: dataset.data[dataset.data.length - 1].y,
              backgroundColor: 'transparent',
              color: hexToRgba(cssVar, 1),
              content: `${dataset.label}`,
              position: 'right',
              xAdjust: 45,
              font: {
                size: 14
              }
            }
          })]
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Term'
        },
        afterFit: (scale: any) => {
          scale.paddingRight = 10;
        }
      },
      y: {
        min: 0,
        max: 4.2,
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
  }), [adjustOpacities, hoveredDatasetIndex, datasets]);

  const finalData: ChartData<'line', LineDataPoint[]> = useMemo(() => {
    const processedDatasets = hoveredDatasetIndex !== null 
      ? adjustOpacities(hoveredDatasetIndex)
      : adjustOpacities(-1);

    /** 
     * Each dataset in processed datasets is already sorted, we just
     * need to verify that when the graph renders the dataset with the largest
     * bias in history gets rendered first (i.e. the oldest)
     */
    processedDatasets.sort((a: LineChartDataset, b: LineChartDataset) => {
      const firstTermA = a.data[0].x;
      const firstTermB = b.data[0].x;
      return termToSortableInteger(firstTermA) - termToSortableInteger(firstTermB)
    });
    processedDatasets.forEach((dataset: LineChartDataset) => {
      dataset.data.sort((a: LineDataPoint, b: LineDataPoint) => {
        return termToSortableInteger(a.x) - termToSortableInteger(b.x);
      });
    });

    const termsToRender: string[] = allTerms.slice(allTerms.findIndex(term => term === processedDatasets[0]?.data[0].x));
    return {
      /** Respect ordering of terms by using allTerms.slice() here (really important) */
      labels: termsToRender, 
      datasets: [
        ...processedDatasets.map((dataset: LineChartDataset) => ({
          label: dataset.label,
          data: dataset.data.map(point => ({ x: point.x, y: point.y })),
          borderColor: dataset.borderColor,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          fill: false,
          tension: 0.4,
          spanGaps: true,
        })),
        /** Average lines */
        ...processedDatasets.map((dataset: LineChartDataset, index: number) => ({
          label: `${dataset.label} Avg`,
          data: termsToRender.map((term): LineDataPoint => ({
            x: term,
            y: averagesMap?.get(datasets[index].label)?.GPA ?? null
          })),
          borderColor: '#8d8d8d',
          borderDash: [15, 15], // First number is dash length, second is gap length
          borderWidth: 1,
          pointRadius: 0,
          hidden: hoveredDatasetIndex !== index, // Only show for hovered dataset
        }))
      ]
    };
  }, [datasets, hoveredDatasetIndex, adjustOpacities]);

  return (
    <Line 
      data={finalData} 
      options={options} 
    />
  );
}

export default LineChart;