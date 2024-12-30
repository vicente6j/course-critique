'use client'
import { FC, Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import { Input } from "@nextui-org/input";
import CreateIcon from '@mui/icons-material/Create';
import { useProfile } from "../server-contexts/profile/provider";
import { useDegreePlanContext } from "../client-contexts/degreePlanContext";

export interface ScheduleDropdownProps {
  options: Array<{ 
    label: string; /** schedule_id */
    customNode?: React.ReactNode;
    onClick: () => void;
    helper?: boolean;
  }>;
  selectedOption: string; /** schedule_id */
  text?: string;
}

const ScheduleDropdown: FC<ScheduleDropdownProps> = ({
  options,
  selectedOption,
  text,
}: ScheduleDropdownProps) => {

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [noneSelected, setNoneSelected] = useState<boolean>(selectedOption === 'Select a schedule');
  const [activeHelper, setActiveHelper] = useState<string | null>(null);
  const [helperValue, setHelperValue] = useState<string>('');
  const helperRef = useRef<HTMLInputElement | null>(null);

  const { scheduleMap } = useProfile();
  const { createNewSchedule } = useDegreePlanContext();

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        setIsOpen(false);
        setActiveHelper(null);
        createNewSchedule(helperValue);
        setHelperValue('');
        break;
      case 'ArrowDown':
        break;
      case 'ArrowUp':
        break;
      default:
        return;
    }
    e.preventDefault();
  }, [helperValue, createNewSchedule]);
 
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
            <div key={index} className="flex flex-row items-center">
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (option.helper) {
                    setActiveHelper(activeHelper === option.label ? null : option.label);
                    setHelperValue('');
                  } else {
                    option.onClick();
                    setTimeout(() => {
                      setIsOpen(false);
                      setActiveHelper(null);
                    }, 25);
                  }
                }}
                className={`
                  ${selectedOption === option.label ? 'bg-gray-100' : ''} 
                  min-w-56 px-4 py-2 text-left hover:bg-gray-100 text-sm bg-white rounded-none
                  ${index === 0 ? 'border-t' : index === options.length - 1 ? 'border-b shadow-lg' : ''} 
                  ${option.customNode ? 'border-b border-gray-200' : ''} border-l border-r border-gray-200`
                }
              >
                <div className="p-0 flex flex-row justify-between gap-4 items-center">
                  {option.label === 'Select a schedule' ? (
                    option.label /** Handles case of 'Select a schedule' */
                  ) : (
                    option.customNode || scheduleMap!.get(option.label)!.name
                  )}
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
                  <div className="flex flex-row gap-4 bg-white px-4 py-2 whitespace-nowrap items-center border border-1 border-gray-200 rounded-none shadow-md">
                    <p className="text-sm">Enter a schedule name</p>
                    <Input
                      isClearable
                      variant="bordered"
                      classNames={{
                        base: "min-w-32",
                        inputWrapper: "p-0 h-5 min-h-5 max-h-5 border-1 border-t-0 border-r-0 border-l-0 rounded-none data-[hover=true]:border-default-200 group-data-[focus=true]:border-default-200",
                        input: "pl-0",
                        clearButton: "p-0"
                      }}
                      placeholder={''}
                      value={helperValue}
                      onClear={onClear}
                      onValueChange={onValueChange}
                      ref={helperRef}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
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
            setActiveHelper(null);
            setHelperValue('');
          }}
        />
      )}
    </div>
  );
}

export default ScheduleDropdown;