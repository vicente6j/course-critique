import { FC, useCallback, useMemo, useState } from "react";
import { hexToRgba, termToSortableInteger } from "./averageOverTime";
import { PriorityQueue } from '@datastructures-js/priority-queue';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

export interface CorrelationDataset {
  name: string;
  vector: number[];
}

export interface CustomCorrelationDataset {
  name: string;
  vector: any[];
}

/**
 * Before coming into this component, the vectors should
 * already be normalized across the terms/params they span. e.g.
 * in the case of a correlation matrix representing the correlation
 * between two different courses in their GPAs over time, the vector
 *  v* = <3.15, 3.02, 3.11, ...>
 * should be the same size as every other vector
 *  q* = <2.98, 2.99, 2.68, ...>
 * and span the same parameter (in this case, the same terms).
 * 
 * HOWEVER, in some cases we may decide to incorporate variable
 * size vectors to compute coefficients between variable sized lists.
 * e.g. courses and the terms they were offered. In these cases,
 * we can use a custom correlation dataset and filter in this particular
 * component rather than normalizing to begin with.
 */
export interface CorrelationMatrixProps {
  regularDatasets?: CorrelationDataset[];
  customDatasets?: CustomCorrelationDataset[];
  /** 
   * Just maps each label in either regular or custom datasets to a color 
   */
  colorDict?: Map<string, string>;
}

export interface CorrelationPair {
  course1: string;
  course2: string;
  correlation: number;
}

const CorrelationMatrix: FC<CorrelationMatrixProps> = ({
  regularDatasets,
  customDatasets,
  colorDict,
}: CorrelationMatrixProps) => {

  const computeCorrelationCoefficient: (xVector: number[], yVector: number[]) => number = useCallback((
    xVector,
    yVector,
  ) => {

    const n = xVector.length; /** Both should be the same size now */
    const xbar = xVector.reduce((a, b) => a + b, 0) / n;
    const ybar = yVector.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    let xVar = 0;
    let yVar = 0;
    for (let i = 0; i < n; i++) {
      const xDiff = xVector[i] - xbar;
      const yDiff = yVector[i] - ybar;
      numerator += (xDiff * yDiff);
      xVar += (xDiff * xDiff);
      yVar += (yDiff * yDiff);
    }
    denominator = Math.sqrt(xVar * yVar);
    return numerator / denominator;
  }, []);

  const getHeatMatrixColor: (value: number) => string = useCallback((value) => {
    const intensity = Math.abs(value);
    if (value < 0) {
      return hexToRgba('#FE466C', intensity); /** Shade of red */
    } else {
      return hexToRgba('#11AF22', intensity); /** Shade of green */
    }
  }, []);

  const correlationMatrixRegular: any = useMemo(() => {
    if (!regularDatasets) {
      return [];
    }
    let matrix: number[][] = [];
    for (const dataset1 of regularDatasets) {
      let dataset1Coefficients: number[] = [];
      for (const dataset2 of regularDatasets) {
        const xVector = dataset1.vector;
        const yVector = dataset2.vector;
        const correlation = computeCorrelationCoefficient(xVector, yVector);
        dataset1Coefficients.push(correlation);
      }
      matrix.push(dataset1Coefficients);
    }
    return {
      matrix: matrix,
      labels: regularDatasets.map(dataset => dataset.name),
    };
  }, [regularDatasets]);

  const correlationMatrixCustom: any = useMemo(() => {
    if (!customDatasets) {
      return [];
    }
    let matrix: any[][] = [];
    for (const dataset1 of customDatasets) {
      let dataset1Coefficients: number[] = [];
      for (const dataset2 of customDatasets) {
        let xVector = dataset1.vector;
        let yVector = dataset2.vector;

        /** Normalize the two vectors such that they only compare like terms */
        xVector = xVector.filter(xi => yVector.some(yi => yi.term === xi.term))
          .sort((a, b) => termToSortableInteger(a.term) - termToSortableInteger(b.term))
          .map(el => el.GPA!);

        yVector = yVector.filter(yi => dataset1.vector.some(xi => xi.term === yi.term))
          .sort((a, b) => termToSortableInteger(a.term) - termToSortableInteger(b.term))
          .map(el => el.GPA!);

        const correlation = computeCorrelationCoefficient(xVector, yVector);
        dataset1Coefficients.push(correlation);
      }
      matrix.push(dataset1Coefficients);
    }
    return {
      matrix: matrix,
      labels: customDatasets.map(dataset => dataset.name),
    };
  }, [customDatasets]);

  const correlationMatrix: any = useMemo(() => {
    if (regularDatasets) {
      return correlationMatrixRegular;
    }
    return correlationMatrixCustom;
  }, [correlationMatrixRegular, correlationMatrixCustom]);

  const correlationPqs: PriorityQueue<CorrelationPair>[] = useMemo(() => {
    if (!correlationMatrix) {
      return [];
    }
    const positivePq = new PriorityQueue<CorrelationPair>((a, b) => (
      b.correlation - a.correlation
    ));
    const negativePq = new PriorityQueue<CorrelationPair>((a, b) => (
      a.correlation - b.correlation
    ));
    const processedPairs = new Set<string>();

    correlationMatrix.matrix.forEach((row: number[], i: number) => {
      row.forEach((entry, j: number) => {
        const course1 = correlationMatrix.labels[i];
        const course2 = correlationMatrix.labels[j];
        const pairKey = [course1, course2].sort().join('|');
        if (i === j || processedPairs.has(pairKey)) {
          return;
        }
        processedPairs.add(pairKey);
        positivePq.enqueue({
          course1: course1,
          course2: course2,
          correlation: entry,
        });
        negativePq.enqueue({
          course1: course1,
          course2: course2,
          correlation: entry,
        });
      });
    });

    return [positivePq, negativePq];
  }, [correlationMatrix]);

  const GeneralTrend: React.ReactNode = useMemo(() => {
    if (!correlationPqs) {
      return <></>;
    }
    let datasets = regularDatasets ? regularDatasets : customDatasets!;
    const threshold = 0.7;
    const labels = datasets.map(dataset => dataset.name);
    const positiveCorrelations: CorrelationPair[] = [];
    const negativeCorrelations: CorrelationPair[] = [];
    let i = 0;
    while (!correlationPqs[0].isEmpty() && i < 3
        && correlationPqs[0].front()!.correlation > threshold) {
      positiveCorrelations.push(correlationPqs[0].dequeue()!);
      i++;
    }
    let j = 0;
    while (!correlationPqs[1].isEmpty() && j < 3
        && correlationPqs[1].front()!.correlation < threshold * -1) {
      negativeCorrelations.push(correlationPqs[1].dequeue()!);
      j++;
    }
    const includeCommas = labels.length > 2;
    const anyPositiveCorrelation = positiveCorrelations.length > 0;
    const anyNegativeCorrelation = negativeCorrelations.length > 0;

    return (
      <div className="text-gray-400 text-sm">
        {!anyPositiveCorrelation ? (
          <p className="text-sm">
            {'- There doesn\'t seem to be any notable positive correlations (r > 0.7).'}
          </p>
        ) : (
          <>
            The general trend between {includeCommas ? (
              <>
                {labels.slice(0, labels.length - 1).map((label, idx) => 
                  <span 
                    key={idx} 
                    className="font-semi-bold"
                  >
                    {label},{' '} 
                  </span>
                )} and <span className="font-semi-bold">{labels[labels.length - 1]}</span>
              </>
            ) : (
              <>
                <span className="font-semi-bold">{labels[0]}</span> and <span className="font-semi-bold">{labels[1]} {' '}</span>
              </>
            )} 
            seems to be that
            <>
              {positiveCorrelations.map((pair: CorrelationPair, idx) => (
              <p className="text-sm block" key={idx}>
                - {pair.course1} and {pair.course2} are highly positively correlated, with a correlation
                coefficient of <span className="font-semi-bold">{pair.correlation.toFixed(2)}</span>
              </p>
              ))}
            </>
          </>
        )}
        {!anyNegativeCorrelation ? (
          <p className="text-sm">
            {'- There doesn\'t seem to be any notable negative correlations (r < -0.7).'}
          </p>
        ) : (
          <>
            Meanwhile,
            <>
              {negativeCorrelations.map((pair: CorrelationPair, idx) => (
              <p className="text-sm block" key={idx}>
                - {pair.course1} and {pair.course2} are highly negatively correlated, with a correlation
                coefficient of <span className="font-semi-bold">{pair.correlation.toFixed(2)}</span>
              </p>
              ))}
            </> 
          </>
        )}
      </div>
    )
  }, [correlationPqs]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {GeneralTrend}
      <div className="flex flex-col gap-2">
        <h1 className="heading-xs font-regular">Correlation Matrix</h1>
        <table className="border-collapse w-fit">
          <thead>
            <tr>
              <th className="p-2"></th>
              {correlationMatrix.labels.map((label: string, i: number) => (
                <th 
                  key={i} className="p-2 text-xs font-regular"
                  style={{ 
                    color: colorDict?.get(label)
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationMatrix.matrix.map((row: number[], i: number) => (
              <tr key={i}>
                <td 
                  className="p-2 text-xs font-regular"
                  style={{ 
                    color: colorDict?.get(correlationMatrix.labels[i])
                  }}
                >
                  {correlationMatrix.labels[i]}
                </td>
                {row.map((correlation, j) => (
                  <td
                    key={j}
                    className="p-2 border border-gray-200 w-16 h-16 text-center"
                    style={{
                      backgroundColor: getHeatMatrixColor(correlation),
                      color: Math.abs(correlation) > 0.5 ? 'white' : 'black'
                    }}
                  >
                    {correlation.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CorrelationMatrix;