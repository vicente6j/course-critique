import { FC } from "react";
import TermGrid from "./termGrid";
import DegreePlanHeader from "./header";
import { useProfile } from "../contexts/profile/provider";

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  return (
    <div className="w-full">
      <div className="w-4/5 mx-auto mt-8">
        <div className="flex flex-col gap-8 w-full mb-8">
         <DegreePlanHeader />
          <TermGrid />
        </div>
      </div>
    </div>
  );
}

export default DegreePlanPageClient;