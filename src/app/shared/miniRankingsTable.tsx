import { FC } from "react";
import { PrevTermInfo } from "../home/homePage";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { getClientColorFromGPA } from "../utils";
import RankingsTable, { RankingsTableRow } from "../rankings/rankingsTable";
import ArrowRight from "../components/arrowRight";

export interface MiniRankingsTableProps {
  header: string;
  subheading: React.ReactNode;
  subheadingTuples: React.ReactNode[];
  rows: RankingsTableRow[];
  type: MiniRankingsTableType;
}

export type MiniRankingsTableType = 'course' | 'prof';

const MiniRankingsTable: FC<MiniRankingsTableProps> = ({
  header,
  subheading,
  subheadingTuples,
  rows,
  type,
}: MiniRankingsTableProps) => {

  return (
    <div className="flex flex-col gap-2 z-10">
      <h1 className="heading-md font-regular w-fit">{header}</h1>
      <div className="flex flex-row gap-8 items-center">
        <p className="text-sm font-semi-bold z-10">{subheading}</p>
        <div className="flex flex-row gap-6 items-center">
          {subheadingTuples.map(tuple => {
            return tuple;
          })}
        </div>
      </div>
      <RankingsTable
        rows={rows}
        type={type}
      />
      {type === 'course' ? (
        <ArrowRight 
          displayText={'View all course rankings'}
          href={'/rankings/course'}
        />
      ) : (
        <ArrowRight 
          displayText={'View all prof rankings'}
          href={'/rankings/prof'}
        />
      )}
    </div>
  );
}

export default MiniRankingsTable;