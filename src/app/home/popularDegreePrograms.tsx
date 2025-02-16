import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useDegreePrograms } from "../server-contexts/degree-programs/provider";
import { DegreeProgramAveragesByTerm } from "../api/degree-programs";
import { metadata } from "../metadata";
import PersonIcon from '@mui/icons-material/Person';

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
    return (screenWidth - 310) / 300;
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
        className="h-fit min-w-[280px] max-w-[280px] bg-gray-200 cursor-pointer px-6 pb-4 flex flex-col rounded-md hover:bg-gray-300"
        key={programId}
      >
        <div className="flex flex-col gap-2 py-4 px-2 overflow-y-auto">
          <h1 className="text-md text-left">{name}</h1>
          <div className="flex flex-row gap-2 items-center">
            <PersonIcon 
              style={{ width: '20px' }}
            />
            <p className="text-sm">{averagesInfo?.enrollment || 0}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{maps.degreePrograms?.get(programId)?.total_credits} hours</p>
      </div>
    )
  }, [maps.degreePrograms]);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="heading-md font-regular">Popular Degree Programs</h1>
      <div className="flex flex-row gap-8 justify-center">
        {popularDegreePrograms.slice(0, numItems).map(program => (
          degreeProgramCard(program.program)
        ))}
      </div>
    </div>
  );
}

export default PopularDegreePrograms;