import { FC, useCallback, useEffect, useState } from "react";
import { useProfile } from "../server-contexts/profile/provider";
import { useTermSelectionContext } from "../client-contexts/termSelectionContext";
import { termToSortableInteger } from "../home/averageOverTime";
import { ALL_TERMS } from "../metadata";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Skeleton } from "@nextui-org/skeleton";

export interface TermsSelectedProps {}

const TermsSelected: FC<TermsSelectedProps> = ({

}: TermsSelectedProps) => {

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
    <div className="flex flex-col gap-4">
      <p className="heading-sm font-regular">Terms Selected</p>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 flex-wrap">
          {showUnselected ? (
            ALL_TERMS.map((term) => {
              const isSelected = termsSelected!.includes(term);
              return (
                <div 
                  className={
                    `flex flex-row h-fit gap-2 rounded-lg px-2 py-1 items-center cursor-pointer border border-gray-300
                    ${isSelected ? 'bg-gray-300 hover:bg-gray-200' : 'bg-none hover:bg-gray-100'}
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
            })
          ) : (
            (loading ? ALL_TERMS : termsSelected)?.map((term: string) => {
              return (
                <Skeleton isLoaded={!loading} key={`key-${term}`}>
                  <div 
                    className="flex flex-row bg-gray-200 hover:bg-gray-100 border border-gray-300 
                    h-fit gap-2 rounded-lg px-2 py-1 items-center cursor-pointer"
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
            })
          )}
        </div>
        <p 
          className="text-sm px-0 py-1 cursor-pointer text-blue-400 hover:text-blue-700 w-fit"
          onClick={() => {
            setShowUnselected(!showUnselected);
          }}
        >
          {showUnselected ? 'Show less' : 'Show more'}
        </p>
      </div>
    </div>
  );
}

export default TermsSelected;