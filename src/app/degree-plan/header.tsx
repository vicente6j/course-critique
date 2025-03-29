'use client'
import { FC } from "react";
import { Skeleton } from "@nextui-org/skeleton";
import { suffixDict } from "../profile/client";
import { useDegreePrograms } from "../contexts/server/degree-programs/provider";
import ArrowRight from "../components/arrowRight";
import { useProfileContext } from "../hooks/profile/profileContext";

export interface DegreePlanHeaderProps {}

const DegreePlanHeader: FC<DegreePlanHeaderProps> = ({

}: DegreePlanHeaderProps) => {

  const { 
    maps,
    loading
  } = useDegreePrograms();

  const {
    data
  } = useProfileContext();

  return (
    <div className="flex flex-col w-full shadow-sm">
      <div className="relative flex flex-col gap-4 w-full bg-white p-8">
        <div className="flex flex-col gap-2">
          <Skeleton 
            isLoaded={!loading} 
          >
            {data.degreeProgram ? (
              <h1 className="heading-md">{maps.degreePrograms?.get(data.degreeProgram)!.name}</h1>
            ) : (
              <h1 className="heading-md">No degree program specified</h1>
            )}
          </Skeleton>

          <Skeleton 
            isLoaded={!loading}
          >
            <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-10 text-md items-center">
              <h1 className="heading-xs">Year</h1>
              {data.year ? (
                <h1 className="font-sm">{`${suffixDict[data.year]} year`}</h1>
              ) : (
                <h1 className="font-sm text-gray-400">None</h1>
              )}
              <h1 className="heading-xs">Secondary Major</h1>
              {data.secondaryDegreeProgram ? (
                <h1 className="font-sm">{maps.degreePrograms?.get(data.secondaryDegreeProgram)!.name}</h1>
              ) : (
                <h1 className="font-sm text-gray-400">None</h1>
              )}
              <h1 className="heading-xs">Minor</h1>
              {data.minorProgram ? (
                <h1 className="font-sm">{maps.degreePrograms?.get(data.minorProgram!)!.name}</h1>
              ) : (
                <h1 className="font-sm text-gray-400">None</h1>
              )}
            </div>
          </Skeleton>
        </div>
        
        <ArrowRight 
          displayText={'Update'}
          href="/profile"
          justify="justify-start"
        />
      </div>
    </div>
  )
}

export default DegreePlanHeader;