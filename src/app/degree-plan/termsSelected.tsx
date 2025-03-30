import { FC, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { scheduleTerms } from "../metadata";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useTermSelectionContext } from "../hooks/termSelection/termSelectionContext";

export interface TermsSelectedProps {}

const TermsSelected: FC<TermsSelectedProps> = ({

}: TermsSelectedProps) => {

  const [hovering, setHovering] = useState<boolean>(false);

  const {
    termsSelected,
    handlers
  } = useTermSelectionContext();

  return (
    <div 
      className={`
        relative flex flex-col w-full bg-white p-8 transition-all duration-300 ease-in-out shadow-lg
        ${hovering ? 'gap-4' : 'gap-0'} 
      `}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className={`flex flex-row gap-4 items-center`}>
        <p className="heading-md font-regular">Terms Selected</p>
        {hovering ? (
          <KeyboardArrowUpIcon 
            style={{
              width: '30px',
              height: '30px',
              color: '#000'
            }}
          />
        ) : (
          <KeyboardArrowDownIcon 
            style={{
              width: '30px',
              height: '30px',
              color: '#000'
            }}
          />
        )}
      </div>
      <div 
        className={`
          flex flex-row gap-2 flex-wrap 
          transition-all duration-300 ease-in-out
          ${hovering ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 invisible'}
        `}
      >
        {scheduleTerms.map(term => {
          const isSelected = termsSelected?.includes(term);
          return (
            <div 
              className={
                `flex flex-row h-fit gap-2 rounded-lg px-2 py-1 items-center cursor-pointer border border-gray-400
                ${isSelected ? 'bg-gray-300 hover:bg-gray-200' : 'bg-none hover:bg-gray-100'}
              `}
              onClick={() => {
                if (isSelected) {
                  handlers.handleUnselectTerm(term);
                } else {
                  handlers.handleSelectTerm(term);
                }
              }}
              key={`key-${term}`}
            >
              {isSelected ? (
                <CloseIcon 
                  style={{ 
                    width: '14px', 
                    height: '14px' 
                  }}
                />
              ) : (
                <AddIcon 
                  style={{ 
                    width: '14px', 
                    height: '14px' 
                  }}
                />
              )}
              <p className="text-sm">{term}</p>
            </div>
            )
          })}
      </div>
    </div>
  );
}

export default TermsSelected;