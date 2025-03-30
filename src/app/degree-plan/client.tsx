import { FC, useState } from "react";
import TermGrid from "./termGrid";
import DegreePlanHeader from "./header";
import HowToUse from "./howToUse";
import TermsSelected from "./termsSelected";
import { Tabs, Tab } from "@heroui/tabs";
import SchedulePage from "./schedulePage";

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  const [selectedTab, setSelectedTab] = useState<string | null>('degree-plan');

  return (
    <div className="w-4/5 mx-auto flex flex-col gap-8 my-8">
      <Tabs 
        aria-label="options"
        variant="underlined"
        color="primary"
        radius="md"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        disableAnimation
        classNames={{
          base: "border-b border-gray-300 w-fit",
          tabList: "p-0"
        }}
      >
        <Tab 
          key="degree-plan" 
          title="Degree Plan" 
          className={`
            text-sm px-5 py-2
            ${selectedTab === 'degree-plan' ? 'data-[selected=true]:after: border-b border-blue-400' : ''} after:w-[99%]
          `}
        />
        <Tab 
          key="schedules" 
          title="Schedules" 
          className={`
            text-sm px-5 py-2
            ${selectedTab === 'schedules' ? 'data-[selected=true]:after: border-b border-blue-400' : ''} after:w-[99%]
          `}
        />
      </Tabs>
      {selectedTab === 'degree-plan' ? (
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-8 w-full">
            <DegreePlanHeader />
            <TermsSelected />
            <HowToUse />
          </div>
          <TermGrid />
        </div>
      ) : selectedTab === 'schedules' && (
        <div className="flex flex-col gap-16">
          <SchedulePage />
        </div>
      )}
    </div>
  );
}

export default DegreePlanPageClient;