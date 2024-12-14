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

  const [showTermsSelected, setShowTermsSelected] = useState<boolean>(false);
  const [termsSelected, setTermsSelected] = useState<Record<string, boolean> | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);

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
    setTermsSelected(Object.fromEntries(termsToSelect.map(term => [term, true])));
  }, [profile?.year]);

  const filteredForTrue: string[] | null = useMemo(() => {
    if (!termsSelected) {
      return [];
    }
    return Object.keys(termsSelected!).filter(key => termsSelected![key] === true);
  }, [termsSelected]);

  const filteredForFalse: string[] | null = useMemo(() => {
    if (!termsSelected) {
      return [];
    }
    return Object.keys(termsSelected!).filter(key => termsSelected![key] === false);
  }, [termsSelected]);

  useEffect(() => {
    setTerms();
  }, [setTerms]);

  return (
    <div className="w-full">
      <div className="w-4/5 mx-auto my-8 flex flex-col gap-16">
        <div className="flex flex-col gap-8 w-full">
          <DegreePlanHeader />
          <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-8 text-sm">
            <h1 className="heading-sm">Terms Selected</h1>
            {showTermsSelected ? (
              <div className="flex flex-row gap-2 items-center flex-wrap items-center">
                {filteredForTrue!.map((term: string) => {
                  return (
                    <div 
                      className="flex flex-row h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        setTermsSelected(prev => {
                          const newObj = { ...prev };
                          newObj[term] = false;
                          return newObj
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
                {filteredForFalse!.map((term: string) => {
                  return (
                    <div 
                      className="flex flex-row bg-gray-300 h-fit gap-2 border border-gray-300 rounded-lg px-2 py-1 items-center hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        setTermsSelected(prev => {
                          const newObj = { ...prev };
                          newObj[term] = true;
                          return newObj
                        });
                      }}
                      key={`key-${term}`}
                    >
                      <AddIcon 
                        style={{ width: '14px', height: '14px' }}
                        className={`p-0`}
                      />
                      <p className="text-sm">{term}</p>
                    </div>
                  )
                })}
                <div 
                  className="flex flex-row gap-1 items-center w-fit cursor-pointer ml-2"
                  onClick={() => {
                    setShowTermsSelected(false);
                    setIsHovering(false);
                  }}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <p className={`${isHovering ? 'underline' : ''} cursor-pointer text-blue-500 p-0 text-sm`}>
                    Close
                  </p>
                  <ArrowLeftIcon 
                    style={{ color: '#338ef7' }} 
                  />
                </div>
              </div>
            ) : (
              <div 
                className="flex flex-row gap-1 items-center w-fit cursor-pointer"
                onClick={() => {
                  setShowTermsSelected(true);
                  setIsHovering(false);
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <p className={`${isHovering ? 'underline' : ''} cursor-pointer text-blue-500 p-0 text-sm`}>
                  Show
                </p>
                <ArrowRightIcon 
                  style={{ color: '#338ef7' }} 
                />
              </div>
            )}
          </div>
        </div>
        <TermGrid 
          termsSelected={filteredForTrue}
          setTermsSelected={setTermsSelected}
        />
      </div>
    </div>
  );
}

export default DegreePlanPageClient;