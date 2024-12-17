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

export interface DegreePlanPageClientProps {}

const DegreePlanPageClient: FC<DegreePlanPageClientProps> = ({

}: DegreePlanPageClientProps) => {

  const [termsSelected, setTermsSelected] = useState<string[] | null>(null);
  const [showUnselected, setShowUnselected] = useState<boolean>(false);

  const { profile } = useProfile();

  const setTerms: () => void = useCallback(() => {
    if (!profile) {
      return [];
    } else if (!profile.year) {
      /** If we don't have a year, just set to default */
      const startTerm = `Fall ${Metadata.is_spring ? Metadata.year - 1 : Metadata.year}`;
      const i = ALL_TERMS.findIndex((term: string) => term === startTerm);
      return i !== -1 ? ALL_TERMS.slice(i, i + 12) : [];
    }
    const startYear = Metadata.is_spring ? Metadata.year - profile.year : Metadata.year - profile.year + 1;
    const startTerm = `Fall ${startYear}`;

    const i = ALL_TERMS.findIndex((term: string) => term === startTerm);
    const termsToSelect = i !== -1 ? ALL_TERMS.slice(i, i + 12) : [];
    setTermsSelected(termsToSelect);
  }, [profile?.year]);

  const unselectedTerms: string[] | null = useMemo(() => {
    return [...ALL_TERMS.filter(term => !termsSelected?.includes(term))];
  }, [termsSelected]);

  useEffect(() => {
    setTerms();
  }, [setTerms]);

  return (
    <div className="w-full">
      <div className="w-4/5 mx-auto my-8 flex flex-col gap-16">
        <div className="flex flex-col gap-8 w-full">
          <DegreePlanHeader />
          <div className="flex flex-row gap-2 flex-wrap">
            {showUnselected ? (
              <>
                {ALL_TERMS?.map((term: string) => {
                  const isSelected = termsSelected!.includes(term);
                  return (
                    <div 
                      className={`flex flex-row h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center cursor-pointer
                        ${isSelected ? 'hover:bg-gray-200' : 'bg-gray-300 hover:bg-gray-200'}
                      `}
                      onClick={() => {
                        if (isSelected) {
                          setTermsSelected(prev => {
                            return [...prev!.filter(myTerm => myTerm !== term)];
                          });
                        } else {
                          setTermsSelected(prev => {
                            return [...prev!, term];
                          });
                        }
                      }}
                      key={`key-${term}`}
                    >
                      {isSelected ? (
                        <CloseIcon 
                          style={{ width: '14px', height: '14px' }}
                          className={`p-0`}
                        />
                      ) : (
                        <AddIcon 
                          style={{ width: '14px', height: '14px' }}
                          className={`p-0`}
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
                      className="flex flex-row h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        setTermsSelected(prev => {
                          return [...prev!.filter(myTerm => myTerm !== term)];
                        });
                      }}
                      key={`key-${term}`}
                    >
                      <CloseIcon 
                        style={{ width: '14px', height: '14px' }}
                        className={`p-0`}
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
          setTermsSelected={setTermsSelected}
        />
      </div>
    </div>
  );
}

export default DegreePlanPageClient;