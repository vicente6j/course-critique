import { FC } from "react";
import TermGrid from "./termGrid";
import DegreePlanHeader from "./header";
import HowToUse from "./howToUse";
import TermsSelected from "./termsSelected";

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  return (
    <div className="w-full">
      <div className="w-4/5 mx-auto my-8 flex flex-col gap-16">
        <div className="flex flex-col gap-8 w-full">
          <DegreePlanHeader />
          <TermsSelected />
          <HowToUse />
        </div>
        {/* <TermGrid /> */}
      </div>
    </div>
  );
}

export default DegreePlanPageClient;