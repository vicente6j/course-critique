import { Dispatch, FC, SetStateAction, useState } from "react";
import { Prof, useProfs } from "../contexts/prof";
import { Card, CardBody, Link, Tab, Tabs } from "@nextui-org/react";
import { useCourses } from "../contexts/course";
import { useRouter } from "next/navigation";

export interface ProfHeaderProps {
  profInfo: Prof;
  hasTaughtIds: string[];
  selectedTab: string;
  setSelectedTab: Dispatch<SetStateAction<string>>;
}

const ProfHeader: FC<ProfHeaderProps> = ({
  profInfo,
  hasTaughtIds,
  selectedTab,
  setSelectedTab,
}: ProfHeaderProps) => {

  const router = useRouter();

  return (
    <div className="flex flex-col w-full shadow-sm">
      <div className="relative flex flex-col w-full bg-white p-8 rounded-top">
        <h1 className="heading-md font-semi-bold">{profInfo.instructor_name}</h1>
        <div className="flex flex-row gap-2 text-sm">
          Has taught
          {hasTaughtIds.slice(0, 3).map((course_id: string) => {
            return (
              <Link 
                onClick={() => {
                  router.push(`/course?courseID=${course_id}`);
                }}
                className="text-sm hover:underline cursor-pointer text-gray-800"
              >
                {course_id}
              </Link>
            );
          })}
          {hasTaughtIds.length > 3 && (
            <p>and others</p>
          )}
        </div>
      </div>
      <Tabs 
        aria-label="Options"
        variant="underlined"
        color="primary"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        fullWidth
        disableAnimation
        classNames={{
          base: "bg-light rounded-bottom",
          tabList: "p-0"
        }}
      >
        <Tab 
          key="overview" 
          title="Overview" 
          className={`${selectedTab === 'overview' ? 'data-[selected=true]:after: border-b border-blue-400' : ''} after:w-[99%]`}
        />
        <Tab 
          key="history" 
          title="History" 
          className={`${selectedTab === 'history' ? 'data-[selected=true]:after: border-b border-blue-400' : ''} after:w-[99%]`}
        />
        <Tab 
          key="info" 
          title="Info" 
          className={`${selectedTab === 'info' ? 'data-[selected=true]:after: border-b border-blue-400' : ''} after:w-[99%]`}
        />
      </Tabs>
    </div>
  )
}

export default ProfHeader;