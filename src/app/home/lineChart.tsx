'use client'
import { ActiveElement, ChartData, ChartEvent } from "chart.js";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from "chart.js";
import { useCourses } from "../contexts/server/course/provider";
import zoomPlugin from 'chartjs-plugin-zoom';
import { hexToRgba, termToSortableInteger } from "../utils";
import { dataTerms } from "../metadata";

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

interface LabelPosition {
  value: number;
  isLabel: boolean;
  datasetIndex: number;
}

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, annotationPlugin, zoomPlugin);

const LineChart: FC<LineChartProps> = ({
  datasets,
  courseColorDict,
  datasetIndex,
}: LineChartProps) => {

  const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState<number | null>(datasetIndex);

  const { 
    maps 
  } = useCourses();

  useEffect(() => {
    setHoveredDatasetIndex(datasetIndex);
  }, [datasetIndex]);

  /**
   * Here the index simply represents the dataset index on which to emphasize (make every other
   * dataset nearly invisible). If index is -1, this suggests no dataset is hovered on.
   */
  const adjustOpacities: (index: number) => LineChartDataset[] = useCallback((index: number) => {
    return datasets.map((dataset, i) => {
      const cssVar = courseColorDict?.get(dataset.label)!;
      return {
        ...dataset,
        borderColor: i === index || index === -1 ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1)
      }
    });
  }, [datasets, courseColorDict]);

  const adjustedLabelYCoordinates: LabelPosition[] | null = useMemo(() => {
    if (!datasets) {
      return null;
    }
    const positions: LabelPosition[] = [];
    datasets.forEach((dataset, idx) => {
      const regular = dataset.data[dataset.data.length - 1].y;
      positions.push({
        value: regular!,
        isLabel: true,
        datasetIndex: idx
      });
    });

    if (hoveredDatasetIndex !== null && hoveredDatasetIndex !== -1) {
      positions.push({
        value: maps.averagesMap?.get(datasets[hoveredDatasetIndex]?.label)?.GPA!,
        isLabel: false,
        datasetIndex: hoveredDatasetIndex
      });
    }
    positions.sort((a, b) => b.value - a.value);
    const minSpacing = 0.25;

    for (let i = 1; i < positions.length; i++) {
      if (positions[i - 1].value - positions[i].value < minSpacing) {
        positions[i].value = positions[i - 1].value - minSpacing;
      }
    }
    return positions;
  }, [datasets, hoveredDatasetIndex]);

  const options: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'point',
      intersect: false,
    },
    layout: {
      padding: {
        right: 100
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
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: 'ctrl',
            sensitivity: 0.5,
          },
          pinch: {
            enabled: true,
            speed: 0.1,
          },
          mode: 'x',
          drag: {
            enabled: true,
            backgroundColor: 'rgba(127,127,127,0.2)',
            borderColor: 'rgb(127,127,127)',
            borderWidth: 1,
          }
        },
        limits: {
          y: {
            min: 0,
            max: 4.2,
          }
        },
      },
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
          ...(hoveredDatasetIndex !== null && hoveredDatasetIndex !== -1 && datasets && adjustedLabelYCoordinates
            ? [{
                type: 'label',
                xValue: dataTerms[dataTerms.length - 1],
                yValue: adjustedLabelYCoordinates.find(el => el.datasetIndex === hoveredDatasetIndex && !el.isLabel)?.value,
                backgroundColor: 'transparent',
                color: '#666',
                content: `avg: ${maps.averagesMap?.get(datasets[hoveredDatasetIndex]?.label)?.GPA?.toFixed(2)}`,
                position: 'right',
                xAdjust: 45,
                font: {
                  size: 12
                }
              }]
            : []),
          ...datasets.map((dataset, idx) => {
            const cssVar = courseColorDict?.get(dataset.label)!;
            const isHovering = hoveredDatasetIndex !== null && hoveredDatasetIndex !== -1 && datasets;
            const adjustedPosition = adjustedLabelYCoordinates?.find(el => el.datasetIndex === idx && el.isLabel)?.value 
              ?? dataset.data[dataset.data.length - 1].y;

            return {
              type: 'label',
              xValue: dataTerms[dataTerms.length - 1],
              yValue: adjustedPosition,
              backgroundColor: 'transparent',
              color: !isHovering ? hexToRgba(cssVar, 1) : hoveredDatasetIndex === idx ? hexToRgba(cssVar, 1) : hexToRgba(cssVar, 0.1),
              content: `${dataset.label === 'ALL' ? 'GT Average' : dataset.label}`,
              position: 'right',
              xAdjust: dataset.label === 'ALL' ? 55 : 45,
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
  }), [adjustOpacities, hoveredDatasetIndex, datasets, adjustedLabelYCoordinates]);

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

    const termsToRender: string[] = dataTerms.slice(dataTerms.findIndex(term => term === processedDatasets[0]?.data[0].x));
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
        ...([
          ...processedDatasets.map((dataset: LineChartDataset, index: number) => ({
            label: `${dataset.label} Avg`,
            data: termsToRender.map((term): LineDataPoint => ({
              x: term,
              y: maps.averagesMap?.get(datasets[index].label)?.GPA ?? null
            })),
            borderColor: '#8d8d8d',
            borderDash: [15, 15], // First number is dash length, second is gap length
            borderWidth: 1,
            pointRadius: 0,
            hidden: hoveredDatasetIndex !== index, // Only show for hovered dataset
          }))
        ])
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