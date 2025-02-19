import { Dispatch, FC, SetStateAction, useCallback, useState } from "react";
import { Card, CardBody, Link, Spinner, Tab, Tabs } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useProfs } from "../server-contexts/prof/provider";
import { CourseInfo } from "../api/course";
import { RadioGroup, Radio } from "@nextui-org/react";

export interface CourseHeaderProps {
  info: CourseInfo | null;
  taughtByIds: string[];
  selectedTab: string;
  setSelectedTab: Dispatch<SetStateAction<string>>;
}

const CourseHeader: FC<CourseHeaderProps> = ({
  info,
  taughtByIds,
  selectedTab,
  setSelectedTab,
}: CourseHeaderProps) => {

  const [seeOthers, setSeeOthers] = useState<boolean>(false);
  
  const { maps: profMaps } = useProfs();
  const router = useRouter();

  const formatProfs: (start: number, end: number) => JSX.Element[] = useCallback((start, end) => {
    return taughtByIds.slice(start, end).map((id: string) => {
      return (
        <Link 
          key={id}
          onClick={() => {
            router.push(`/prof?profID=${id}`);
          }}
          className="text-sm hover:underline cursor-pointer text-gray-800"
        >
          {profMaps.profs!.get(id)?.instructor_name}
        </Link>
      );
    })
  }, [profMaps.profs, taughtByIds]);

  return (
    <div className="flex flex-col w-full shadow-sm">
      <div className="relative flex flex-col w-full bg-white p-8 rounded-top">
        <h1 className="heading-md font-semi-bold">{info?.id}</h1>
        <h1 className="heading-sm">{info?.course_name}</h1>
        <div className="flex flex-row flex-wrap gap-x-2 gap-y-0 text-sm">
          <span>Taught by</span> 
          {formatProfs(0, 3)}
          {taughtByIds.length > 3 && !seeOthers && (
            <p>and {' '}
              <span
                onClick={() => setSeeOthers(!seeOthers)}
                className="hover:underline cursor-pointer text-blue-500"
              >
                ({taughtByIds.length - 3}) others
              </span>
            </p>
          )}
          {taughtByIds.length > 3 && seeOthers && (
            <>
              {formatProfs(3, taughtByIds.length)}
              <span
                onClick={() => setSeeOthers(!seeOthers)}
                className="hover:underline cursor-pointer text-blue-500"
              >
                show less
              </span>
            </>
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
          base: "bg-light rounded-botto border-b border-gray-200",
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

export default CourseHeader;