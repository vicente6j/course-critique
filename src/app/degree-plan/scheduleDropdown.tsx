'use client'
import { FC, useCallback, useMemo, useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import { Input } from "@nextui-org/input";
import CreateIcon from '@mui/icons-material/Create';

export interface ScheduleDropdownProps {
  options: Array<{ 
    label: string;
    customNode?: React.ReactNode;
    onClick: () => void;
    helper?: boolean;
  }>;
  selectedOption: string;
  text?: string;
}

const ScheduleDropdown: FC<ScheduleDropdownProps> = ({
  options,
  selectedOption,
  text,
}: ScheduleDropdownProps) => {

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [noneSelected, setNoneSelected] = useState<boolean>(selectedOption === '');
  const [activeHelper, setActiveHelper] = useState<string | null>(null);
  const [helperValue, setHelperValue] = useState<string>('');

  const onValueChange = (value: string) => {
    setHelperValue(value || '');
  }

  const onClear = () => {
    setHelperValue('');
  }
 
  return (
    <div 
      className="relative block"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      <div className="w-fit flex flex-row gap-2 items-center bg-gray-200 cursor-pointer px-4 py-1 rounded-md hover:bg-gray-300">
        <p className="text-sm">{text}</p>
        <ArrowDropDownIcon 
          style={{ width: '22px', height: '22px', color: noneSelected ? 'gray' : 'default' }}
          className={`transition-transform p-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] overflow-visible left-0 z-20 max-h-60 overflow-y-scroll">
          {options.map((option, index) => (
            <div key={index} className="flex flex-row gap-2 items-center">
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (option.helper) {
                    setActiveHelper(activeHelper === option.label ? null : option.label);
                  } else {
                    option.onClick();
                    setIsOpen(false);
                    setActiveHelper(null);
                  }
                }}
                className={`${selectedOption === option.label ? 'bg-gray-100' : ''} min-w-48 max-w-96 block px-4 py-2 text-left hover:bg-gray-100 text-sm bg-white border border-gray-200 rounded-none shadow-md`}
              >
                <div className="p-0 w-full flex flex-row justify-between gap-4 items-center">
                  {option.customNode || option.label}
                  {selectedOption === option.label && (
                    <CheckIcon 
                      style={{ width: '14px' }}
                    />
                  )}
                </div>
              </button>
              {option.helper && activeHelper === option.label && (
                <div className="z-30 top-0 block min-w-48 bg-white border border-gray-200 shadow-md">
                  <p className="text-sm mb-2">Enter a schedule name</p>
                </div>
              )} 
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={(e) => {
            e.stopPropagation();  
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default ScheduleDropdown;