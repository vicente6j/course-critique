import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckIcon from '@mui/icons-material/Check';

export interface HelperDropdownOption {
  label: string;
  id: string;
  onClick?: () => void;
  isHelper?: boolean; /** e.g. 'Create', 'Edit' */
  isLastHelper?: boolean;
  customDisplayNode?: React.ReactNode; /** e.g. additional icons */
  customHelperNode?: React.ReactNode; /** e.g. an input field to begin typing */
  editNode?: React.ReactNode;
}

export interface HelperDropdownProps {
  options: HelperDropdownOption[];
  selectedOption: string | null; /** ID of the option currently selected */
  hasHelper: boolean;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  optionEdited: string | null;
  inEditMode: boolean;
  setInEditMode: Dispatch<SetStateAction<boolean>>;
  tempObject?: any;
  helperValue?: string | null;
  setHelperValue?: Dispatch<SetStateAction<string | null>>;
  activeHelper?: string | null;
  setActiveHelper?:  Dispatch<SetStateAction<string | null>>;
}

const HelperDropdown: FC<HelperDropdownProps> = ({
  options,
  selectedOption,
  hasHelper,
  optionEdited,
  inEditMode,
  setInEditMode,
  tempObject,
  helperValue,
  setHelperValue,
  activeHelper,
  setActiveHelper,
  isOpen,
  setIsOpen,
}: HelperDropdownProps) => {

  return (
    <div
      className="relative block w-fit h-fit"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      <div className="min-h-8 flex flex-row gap-2 items-center bg-gray-200 cursor-pointer px-4 py-1 rounded-md hover:bg-gray-300">
        <p className={`text-sm ${inEditMode && 'text-gray-400'}`}>
          {/** If we have a temp object defined, show the helperValue (temporarily) */}
          {tempObject ? helperValue : options.find(op => op.id === selectedOption)!.label}
        </p>
        {optionEdited === selectedOption ? (
          /** 
           * Show editing if the option selected (e.g. a schedule_id)
           * is the same item as what prop optionEdited dictates.
           */
          <FiberManualRecordIcon 
            style={{ 
              width: '16px', 
              height: '16px', 
              paddingLeft: '4px', 
              color: 'gray' 
            }}
          />
        ) : (
          <ArrowDropDownIcon 
            style={{ 
              width: '24px', 
              height: '24px', 
              color: 'gray' 
            }}
            className={`transition-transform p-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] min-w-56 overflow-visible left-0 z-20 max-h-60 overflow-y-scroll">
          {options.map((option, index) => (
            <div key={index} className="flex flex-row items-center">
              {inEditMode && option.editNode ? (
                option.editNode
              ) : (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (option.isHelper) {
                      /** Guarantees that there are helpers (dev defined) */
                      setActiveHelper!(activeHelper === option.id ? null : option.id);
                      setHelperValue!('');
                      if (option.id === 'edit') {
                        setInEditMode(!inEditMode); /** Optin with id 'edit' acts as the toggle */
                      }
                    } else {
                      option.onClick!();
                      setTimeout(() => {
                        setIsOpen(false);
                        if (hasHelper) {
                          setActiveHelper!(null);
                        }
                      }, 25);
                    }
                  }}
                  className={`
                    ${selectedOption === option.id ? 'bg-gray-100' : ''} 
                    min-w-56 px-4 py-2 text-left hover:bg-gray-100 text-sm bg-white rounded-none
                    ${index === 0 ? 'border-t' : index === options.length - 1 ? 'border-b shadow-lg' : ''} 
                    ${option.isLastHelper ? 'border-b border-gray-200' : ''} 
                    border-l border-r border-gray-200`
                  }
                >
                  <div className="p-0 flex flex-row justify-between gap-4 items-center">
                    {option.customDisplayNode ? (
                      option.customDisplayNode
                    ) : (
                      option.label
                    )}
                    {selectedOption === option.id && (
                      <CheckIcon 
                        style={{ 
                          width: '14px' 
                        }}
                      />
                    )}
                  </div>
                </button>
              )}
              {option.isHelper && activeHelper === option.id && option.customHelperNode && (
                option.customHelperNode
              )} 
            </div>
          ))}
          <div className="h-[1px] mt-0.5 w-0 shadow-lg" />
        </div>
      )}

      {isOpen && (
        <div 
          className={`fixed inset-0 z-10`} 
          onClick={(e) => {
            e.stopPropagation();  
            setIsOpen(false);
            setInEditMode(false);
            if (hasHelper) {
              setActiveHelper!(null);
              setHelperValue!('');
            }
          }}
        />
      )}
    </div>
  );

}

export default HelperDropdown;