'use client'
import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@nextui-org/skeleton";
import { suffixDict } from "../profile/client";
import { Link } from "@nextui-org/react";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useProfile } from "../server-contexts/profile/provider";
import { useDegreePrograms } from "../server-contexts/degree-programs/provider";

export interface DegreePlanHeaderProps {}

const DegreePlanHeader: FC<DegreePlanHeaderProps> = ({

}: DegreePlanHeaderProps) => {
  
  const [arrowRight, setArrowRight] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { degreeProgramMap } = useDegreePrograms();
  const { profile } = useProfile();

  const router = useRouter();

  return (
    <div className="flex flex-col w-full shadow-sm">
      <div className="relative flex flex-col gap-4 w-full bg-white p-8 rounded-top">
        <div className="flex flex-col gap-2">
          <Skeleton isLoaded={!loading} className="w-fit">
            {profile?.degree_program ? (
              <h1 className="heading-md">{degreeProgramMap?.get(profile!.degree_program!)!.name}</h1>
            ) : (
              <h1 className="heading-md">No degree program specified</h1>
            )}
          </Skeleton>
          <Skeleton isLoaded={!loading}>
            <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-10 text-md items-center">
              <h1 className="heading-xs">Year</h1>
              {profile?.year ? (
                <h1 className="font-sm">{`${suffixDict[profile!.year]} year`}</h1>
              ) : (
                <h1 className="font-sm text-gray-400">None</h1>
              )}
              <h1 className="heading-xs">Secondary Major</h1>
              {profile?.secondary_degree_program ? (
                <h1 className="font-sm">{degreeProgramMap?.get(profile!.secondary_degree_program!)!.name}</h1>
              ) : (
                <h1 className="font-sm text-gray-400">None</h1>
              )}
              <h1 className="heading-xs">Minor</h1>
              {profile?.minor_program ? (
                <h1 className="font-sm">{degreeProgramMap?.get(profile!.minor_program!)!.name}</h1>
              ) : (
                <h1 className="font-sm text-gray-400">None</h1>
              )}
            </div>
          </Skeleton>
        </div>
        <div 
          className="flex flex-row gap-4 rounded-lg cursor-pointer "
          onClick={() => {
            router.push('/profile');
          }}
          onMouseEnter={() => setArrowRight(true)}
          onMouseLeave={() => setArrowRight(false)}
        >
          {/**
            * A really weird and important note is that nextui-org/react's link tries to refresh.
            * So use onClick instead of href.
            */}
          <Link 
            className="text-sm"
            onClick={() => {
              router.push('/profile');
            }}
          >
            Update
          </Link>
          <div className={`transition ease-out duration-200 ${arrowRight ? 'translate-x-1' : ''}`}>
            <ArrowRightAltIcon 
              className="hover:cursor-pointer"
              style={{ color: '#338ef7' }} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DegreePlanHeader;