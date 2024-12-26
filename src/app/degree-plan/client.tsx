import { FC, useCallback, useEffect, useMemo, useState } from "react";
import TermGrid from "./termGrid";
import DegreePlanHeader from "./header";
import { useProfile } from "../contexts/profile/provider";
import CloseIcon from '@mui/icons-material/Close';
import { ALL_TERMS, Metadata } from "../metadata";
import { Skeleton } from "@nextui-org/skeleton";
import { Link } from "@nextui-org/link";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import AddIcon from '@mui/icons-material/Add';
import { termToSortableInteger } from "../home/averageOverTime";

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  const [termsSelected, setTermsSelected] = useState<string[] | null>(null);
  const [showUnselected, setShowUnselected] = useState<boolean>(false);
  const [hoverRecord, setHoverRecord] = useState<Record<string, boolean>>({});

  const { profile, termSelectionsMap } = useProfile();

  const fetchFromProfile: () => void = useCallback(() => {
    if (!profile) {
      return [];
    }
    if (termSelectionsMap) {
      const sortedTerms = Array.from(termSelectionsMap.keys())
        .sort((a: string, b: string) => termToSortableInteger(a) - termToSortableInteger(b));
      
      setTermsSelected(sortedTerms);
      setHoverRecord(Object.fromEntries(sortedTerms.map(term => [term, false])));
    }
  }, [termSelectionsMap]);

  const handleSelectTerm: (term: string) => void = useCallback(async (term) => {
    setTermsSelected(prev => {
      const newArr = [...prev!, term];
      newArr.sort((a: string, b: string) => termToSortableInteger(a) - termToSortableInteger(b));
      return newArr;
    });
  }, []);

  const handleUnselectTerm: (term: string) => void = useCallback(async (term) => {
    setTermsSelected(prev => [...prev!.filter(el => el !== term)]);
  }, []);

  useEffect(() => {
    fetchFromProfile();
  }, [fetchFromProfile]);

  return (
    <div className="w-full">
      <div className="w-4/5 mx-auto my-8 flex flex-col gap-16">
        <div className="flex flex-col gap-8 w-full">
          <DegreePlanHeader />
          <div className="flex flex-row gap-2 flex-wrap">
            {showUnselected ? (
              <>
                {ALL_TERMS.map((term: string) => {
                  const isSelected = termsSelected!.includes(term);
                  return (
                    <div 
                      className={`flex flex-row h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center cursor-pointer
                        ${isSelected ? 'hover:bg-gray-100 bg-white' : 'bg-gray-300 hover:bg-gray-100'}
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
                {termsSelected?.map((term: string) => {
                  return (
                    <div 
                      className="flex flex-row bg-white h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleUnselectTerm(term);
                      }}
                      key={`key-${term}`}
                    >
                      <CloseIcon 
                        style={{ width: '14px', height: '14px' }}
                      />
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
                  Show more
                </p>
              </>
            )}
          </div>
        </div>
        <TermGrid 
          termsSelected={termsSelected}
          handleUnselectTerm={handleUnselectTerm}
        />
      </div>
    </div>
  );
}

export default DegreePlanPageClient;