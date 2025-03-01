import { ActiveElement, ChartData, ChartEvent } from "chart.js";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from "chart.js";
import { hexToRgb } from "@mui/material";
import { useCourses } from "../contexts/server/course/provider";
import { LineChartDataset, LineDataPoint } from "../home/lineChart";
import { TERMS_WITH_DATA } from "../metadata";
import { termToSortableInteger } from "../utils";

export interface LineChartProps {
  dataset: LineChartDataset;
}

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, annotationPlugin);

const LineChart: FC<LineChartProps> = ({
  dataset,
}: LineChartProps) => {

  const { maps } = useCourses();
  const [isHovered, setIsHovered] = useState<boolean | null>(false);

  const options: any = useMemo(() => ({
    responsive: true,
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
        setIsHovered(true);
      } else {
        setIsHovered(false);
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
          ...(isHovered && dataset 
            ? [{
                type: 'label',
                xValue: TERMS_WITH_DATA[TERMS_WITH_DATA.length - 1],
                yValue: maps.averagesMap?.get(dataset?.label)?.GPA,
                backgroundColor: 'transparent',
                color: '#666',
                content: `Avg: ${maps.averagesMap?.get(dataset?.label)?.GPA?.toFixed(2)}`,
                position: 'right',
                xAdjust: 45,
                font: {
                  size: 12
                }
              }] : []
          ),
          ...(dataset
            ? [{
                type: 'label',
                xValue: TERMS_WITH_DATA[TERMS_WITH_DATA.length - 1],
                yValue: dataset.data[dataset.data.length - 1].y,
                backgroundColor: 'transparent',
                color: dataset.borderColor,
                content: `${dataset.label}`,
                position: 'right',
                xAdjust: 45,
                font: {
                  size: 14
                }
            }] : []
          )
        ]
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
  }), [dataset, isHovered]);

  const finalData: ChartData<'line', LineDataPoint[]> | null = useMemo(() => {

    if (!dataset) {
      return null;
    }

    dataset.data.sort((a: LineDataPoint, b: LineDataPoint) => {
      return termToSortableInteger(a.x) - termToSortableInteger(b.x);
    });

    const termsToRender: string[] = TERMS_WITH_DATA.slice(TERMS_WITH_DATA.findIndex(term => term === dataset?.data[0].x));
    return {
      /** Respect ordering of terms by using allTerms.slice() here (really important) */
      labels: termsToRender, 
      datasets: [
        {
          label: dataset.label,
          data: dataset.data.map(point => ({ x: point.x, y: point.y })),
          borderColor: dataset.borderColor,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          fill: false,
          tension: 0.4,
          spanGaps: true,
        },
        {
          label: `${dataset.label} Avg`,
          data: termsToRender.map((term): LineDataPoint => ({
            x: term,
            y: maps.averagesMap?.get(dataset.label)?.GPA ?? null
          })),
          borderColor: '#8d8d8d',
          borderDash: [15, 15], // First number is dash length, second is gap length
          borderWidth: 1,
          pointRadius: 0,
          hidden: !isHovered, // Only show for hovered dataset
        }
      ]
    };
  }, [dataset, isHovered]);

  return (
    <div className="h-fit">
      {finalData && (
        <Line 
          data={finalData} 
          options={options} 
        />
      )}
    </div>
  );
}

export default LineChart;