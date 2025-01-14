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
import HideSourceIcon from '@mui/icons-material/HideSource';
import VisibilityIcon from '@mui/icons-material/Visibility';

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  const { termSelectionsMap, loading } = useProfile();
  const { termsSelected, handleSelectTerm, setTermsSelected, handleUnselectTerm } = useTermSelectionContext();

  const [showUnselected, setShowUnselected] = useState<boolean>(false);
  const [showHowToUse, setShowHowToUse] = useState<boolean>(true);
  const [hoverHowToUse, setHoverHowToUse] = useState<boolean>(false);

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

          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-8 items-center">
              <p className="heading-md">How to use</p>
              {showHowToUse ? (
                <div 
                  className="flex gap-2 items-center cursor-pointer"
                  onMouseEnter={() => {
                    setHoverHowToUse(true);
                  }}
                  onMouseLeave={() => {
                    setHoverHowToUse(false);
                  }}
                  onClick={() => {
                    setShowHowToUse(false);
                  }} 
                >
                  <p className={`heading-sm ${hoverHowToUse ? 'text-red-800' : 'text-[var(--color-red)]' } cursor-pointer`}>
                    Hide
                  </p>
                  <HideSourceIcon 
                    style={{ width: '24px', color: `${hoverHowToUse ? 'var(--color-dark-red)' : 'var(--color-red)'}` }}
                    className={`transition-transform ${hoverHowToUse ? 'rotate-180' : ''}`}
                  />
                </div>
              ) : (
                <div 
                  className="flex gap-2 items-center cursor-pointer"
                  onMouseEnter={() => {
                    setHoverHowToUse(true);
                  }}
                  onMouseLeave={() => {
                    setHoverHowToUse(false);
                  }}
                  onClick={() => {
                    setShowHowToUse(true);
                  }} 
                >
                  <p className={`heading-sm ${hoverHowToUse ? 'text-green-800' : 'text-[var(--color-light-green)]' } cursor-pointer`}>
                    Show
                  </p>
                  <VisibilityIcon 
                    style={{ width: '24px', color: `${hoverHowToUse ? 'var(--color-dark-green)' : 'var(--color-light-green)'}` }}
                    className={`transition-transform ${hoverHowToUse ? 'rotate-180' : ''}`}
                  />
                </div>
              )}
            </div>
            {showHowToUse && (
              <div className="flex flex-col gap-4">
                <p className="text-sm">
                  The purpose of this degree planner is to help you construct the layout
                  of your classes every semester. Above you can select the terms you'd like to include,
                  e.g. Fall 2021. Below you'll see the terms you select, along with a table which looks like
                  what follows.
                </p>
                <TermTable term={'Example'}/>
                <p className="text-sm">
                  Notice that the table allows you to add courses as you wish. The dropdown at the top additionally
                  allows you to select a schedule on which to begin saving courses. If you have no schedule selected,
                  nothing will be saved; but if you create a schedule and add courses to it, they'll be saved to your account.
                  You can use a schedule in whichever term you want.
                  Lastly, notice that you can additionally assign grades to courses in your schedule. These are term-specific.
                  i.e. assigning a grade in a schedule in one term won't automatically assign the same grade to the same schedule
                  in a different term.
                </p>
              </div>
            )}
          </div>

        </div>
        <TermGrid />
      </div>
    </div>
  );
}

export default DegreePlanPageClient;