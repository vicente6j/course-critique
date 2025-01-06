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

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  const { termSelectionsMap, loading } = useProfile();
  const { termsSelected, handleSelectTerm, setTermsSelected, handleUnselectTerm } = useTermSelectionContext();

  const [showUnselected, setShowUnselected] = useState<boolean>(false);

  const fetchFromProfile: () => void = useCallback(() => {
    if (!termSelectionsMap) {
      return;
    }
    const sortedTerms = Array.from(termSelectionsMap.keys())
      .sort((a: string, b: string) => termToSortableInteger(a) - termToSortableInteger(b));
    
    setTermsSelected(sortedTerms);
  }, [termSelectionsMap]);

  useEffect(() => {
    fetchFromProfile();
  }, [fetchFromProfile]);

  return (
    <div className="w-full">
      <div className="w-4/5 mx-auto my-8 flex flex-col gap-16">
        <div className="flex flex-col gap-8 w-full">
          <DegreePlanHeader />
          <div className="flex flex-col gap-4">
            <p className="heading-sm font-regular">Terms Selected</p>
            <div className="flex flex-row gap-2 flex-wrap">
              {showUnselected ? (
                <>
                  {ALL_TERMS.map((term: string) => {
                    const isSelected = termsSelected!.includes(term);
                    return (
                      <div 
                        className={
                          `flex flex-row h-fit gap-2 rounded-lg px-2 py-1 items-center cursor-pointer
                          ${isSelected ? 'bg-gray-300 hover:bg-gray-200' : 'border border-gray-300 bg-transparent hover:bg-gray-200'}
                        `}
                        onClick={() => {
                          if (isSelected) {
                            handleUnselectTerm(term);
                          } else {
                            handleSelectTerm(term);
                          }
                        }}
                        key={`key-${term}`}
                      >
                        {isSelected ? (
                          <CloseIcon 
                            style={{ width: '14px', height: '14px' }}
                          />
                        ) : (
                          <AddIcon 
                            style={{ width: '14px', height: '14px' }}
                          />
                        )}
                        <p className="text-sm">{term}</p>
                      </div>
                    )
                  })}
                  <p 
                    className="text-sm px-2 py-1 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setShowUnselected(!showUnselected);
                    }}
                  >
                    Show less
                  </p>
                </>
              ) : (
                <>
                  {(loading ? ALL_TERMS : termsSelected)?.map((term: string) => {
                    return (
                      <Skeleton isLoaded={!loading} key={`key-${term}`}>
                        <div 
                          className="flex flex-row bg-gray-200 hover:bg-gray-300 h-fit gap-2 rounded-lg px-2 py-1 items-center cursor-pointer"
                          onClick={() => {
                            handleUnselectTerm(term);
                          }}
                        >
                          <CloseIcon 
                            style={{ width: '14px', height: '14px' }}
                          />
                          <p className="text-sm">{term}</p>
                        </div>
                      </Skeleton>
                    )
                  })}
                  <p 
                    className="text-sm px-2 py-1 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setShowUnselected(!showUnselected);
                    }}
                  >
                    Show more
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <TermGrid />
      </div>
    </div>
  );
}

export default DegreePlanPageClient;