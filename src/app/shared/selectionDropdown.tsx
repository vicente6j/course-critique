'use client'
import { FC, useCallback, useMemo, useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import { Input } from "@nextui-org/input";
import { SearchIcon } from "../../../public/icons/searchIcon";
import CustomSearchbar from "./customSearchbar";

export interface SelectionDropdownProps {
  options: Array<{ 
    label: string | React.ReactNode;
    onClick: () => void;
  }>;
  selectedOption: string;
  text?: string;
  customTrigger?: React.ReactNode;
  containsSearch?: boolean;
  searchString?: string | null;
  filterOptions?: (searchValue: string, filterType?: any) => any[];
  filterType?: any;
}

const SelectionDropdown: FC<SelectionDropdownProps> = ({
  options : initOptions,
  selectedOption,
  text,
  customTrigger,
  containsSearch,
  searchString,
  filterOptions,
  filterType
}: SelectionDropdownProps) => {

  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [options, setOptions] = useState<any[]>(initOptions);

  const onSearchChange = (value: string) => {
    setSearchValue(value || '');
    if (containsSearch) {
      const newOptions: any[] = filterType ? filterOptions!(value, filterType) : filterOptions!(value);
      setOptions(newOptions);
    }
  }

  const onClear = () => {
    onSearchChange('');
  }

  return (
    <div 
      className="relative inline-block w-full"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      {/** Trigger container */}
      {customTrigger ? (
        customTrigger
      ) : (
        <div className="w-fit flex flex-row gap-2 items-center hover:bg-gray-100 cursor-pointer px-4 py-2 rounded-md border border-gray-300">
          <p className="text-sm">{text}</p>
          <ArrowDropDownIcon 
            style={{ width: '22px', height: '22px' }}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      )}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-20 max-h-60 overflow-y-scroll min-w-48 max-w-96 bg-white border border-gray-200 rounded-none shadow-md">
          {containsSearch && (
            <CustomSearchbar 
              searchValue={searchValue}
              onClear={onClear}
              onSearchChange={onSearchChange}
              searchString={searchString}
              variation="sticky"
            />
          )}
          {options.map((option, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                option.onClick();
                setIsOpen(false);
                onClear();
              }}
              className={`${selectedOption === option.label ? 'bg-gray-100' : ''} block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm`}
            >
              {selectedOption === option.label ? 
                <div className="p-0 w-full flex flex-row justify-between gap-4 items-center">
                  {option.label}
                  <CheckIcon 
                    style={{ width: '14px' }}
                  />
                </div> : option.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={(e) => {
            e.stopPropagation();  
            setIsOpen(false);
            onClear();
          }}
        />
      )}
    </div>
  );
}

export default SelectionDropdown;