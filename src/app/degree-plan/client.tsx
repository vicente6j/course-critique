import { FC, useCallback, useEffect, useMemo, useState } from "react";
import TermGrid from "./termGrid";
import DegreePlanHeader from "./header";
import { useProfile } from "../server-contexts/profile/provider";
import CloseIcon from '@mui/icons-material/Close';
import { ALL_TERMS, Metadata } from "../metadata";
import { Link } from "@nextui-org/link";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import AddIcon from '@mui/icons-material/Add';
import { termToSortableInteger } from "../home/averageOverTime";
import { Skeleton } from "@nextui-org/skeleton";
import { useTermSelection } from "../hooks/useTermSelection";
import { useTermSelectionContext } from "../client-contexts/termSelectionContext";
import TermTable from "./termTable";
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
        <TermGrid />
      </div>
    </div>
  );
}

export default DegreePlanPageClient;