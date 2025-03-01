import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useDegreePrograms } from "../contexts/server/degree-programs/provider";
import { DegreeProgramAveragesByTerm } from "../api/degree-programs";
import { metadata } from "../metadata";
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';

export interface PopularDegreeProgramsProps {}

const PopularDegreePrograms: FC<PopularDegreeProgramsProps> = ({

}: PopularDegreeProgramsProps) => {

  const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize: () => void = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const {
    maps
  } = useDegreePrograms();

  const numItems: number = useMemo(() => {
    /** Want around 350px per item */
    return (screenWidth - 340) / 290;
  }, [screenWidth]);

  const popularDegreePrograms: DegreeProgramAveragesByTerm[] | null = useMemo(() => {
    if (!maps.termToProgramAveragesMap || !maps.termToProgramAveragesMap.get(metadata.global.most_recent_term)) {
      return [];
    }
    const sorted = maps.termToProgramAveragesMap.get(metadata.global.most_recent_term)!.sort((a, b) => (
      (b.enrollment as number) - (a.enrollment as number)
    ));
    return sorted;
  }, [maps]);

  const degreeProgramCard: (programId: string) => React.ReactNode = useCallback((programId) => {
    const averagesInfo = maps.termToProgramAveragesMap?.get(metadata.global.most_recent_term)?.find(averages => (
      averages.program === programId
    ));
    const name = maps.degreePrograms?.get(programId)?.name
      .replace('Bachelor of Science in', '')
      .replace(' - Thread', '');

    return (
      <div 
        className="min-w-[280px] max-w-[280px] min-h-[120px] max-h-[120px] bg-gray-200 cursor-pointer px-6 py-4 flex flex-col rounded-md hover:bg-gray-300 flex-grow"
        key={programId}
      >
        <div className="flex flex-col gap-2 overflow-y-auto flex-grow">
          <h1 className="text-md text-left">{name}</h1>
        </div>
        <p className="text-sm text-gray-600">{maps.degreePrograms?.get(programId)?.total_credits} hours</p>
      </div>
    )
  }, [maps.degreePrograms]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 items-center">
        <h1 className="heading-md font-regular">Popular Degree Programs</h1>
        <NextToolTip 
          content={`Weighing estimated enrollment by program`} 
          className="w-fit"
        >
          <InfoIcon 
            style={{ 
              width: '20px' 
            }} 
          />
        </NextToolTip>
      </div>
      <div className="flex flex-row gap-8 justify-center">
        {popularDegreePrograms.slice(0, numItems).map(program => (
          degreeProgramCard(program.program)
        ))}
      </div>
    </div>
  );
}

export default PopularDegreePrograms;