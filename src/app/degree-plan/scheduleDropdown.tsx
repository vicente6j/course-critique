'use client'
import { FC, Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const helperRef = useRef<HTMLInputElement | null>(null);

  const onValueChange = (value: string) => {
    setHelperValue(value || '');
  }

  const onClear = () => {
    setHelperValue('');
  }

  useEffect(() => {
    if (helperRef && helperRef.current) {
      helperRef!.current!.focus();
    }
  }, [helperRef, activeHelper]);
 
  return (
    <div 
      className="relative block"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      <div className="flex flex-row gap-2 items-center bg-gray-200 cursor-pointer px-4 py-1 rounded-md hover:bg-gray-300">
        <p className="text-sm">{text}</p>
        <ArrowDropDownIcon 
          style={{ width: '22px', height: '22px', color: noneSelected ? 'gray' : 'default' }}
          className={`transition-transform p-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] min-w-56 overflow-visible left-0 z-20 max-h-60 overflow-y-scroll">
          {options.map((option, index) => (
            <div key={index} className="flex flex-row items-end py-1">
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (option.helper) {
                    setActiveHelper(activeHelper === option.label ? null : option.label);
                    setHelperValue('');
                  } else {
                    option.onClick();
                    setIsOpen(false);
                    setActiveHelper(null);
                  }
                }}
                className={`${selectedOption === option.label ? 'bg-gray-100' : ''} min-w-56 px-4 py-2 text-left hover:bg-gray-100 text-sm bg-white border border-gray-200 rounded-none`}
              >
                <div className="p-0 flex flex-row justify-between gap-4 items-center">
                  {option.customNode || option.label}
                  {selectedOption === option.label && (
                    <CheckIcon 
                      style={{ width: '14px' }}
                    />
                  )}
                </div>
              </button>
              {option.helper && activeHelper === option.label && (
                <div className="flex items-center max-h-8">
                  <div className="h-[2px] w-10 bg-gray-300 top-10" />
                  <div className="flex flex-row gap-4 bg-white px-4 py-2 whitespace-nowrap items-center border border-gray-200 rounded-none shadow-md">
                    <p className="text-sm">Enter a schedule name</p>
                    <Input
                      isClearable
                      variant="bordered"
                      classNames={{
                        base: "min-w-24",
                        inputWrapper: "h-5 min-h-5 max-h-5 p-0 border-1 border-t-0 border-l-0 border-r-0 border-default-400 rounded-none group-data-[focus=true]:border-default-400",
                      }}
                      placeholder={''}
                      value={helperValue}
                      onClear={onClear}
                      onValueChange={onValueChange}
                      ref={helperRef}
                    />
                  </div>
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
            setActiveHelper(null);
            setHelperValue('');
          }}
        />
      )}
    </div>
  );
}

export default ScheduleDropdown;