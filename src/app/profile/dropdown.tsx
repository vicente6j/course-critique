'use client'
import { FC, useCallback, useMemo, useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import { Input } from "@nextui-org/input";
import { SearchIcon } from "../../../public/icons/searchIcon";
import StickySearchbar from "./stickySearchbar";

export interface DropdownProps {
  options: Array<{ 
    label: string;
    onClick: () => void;
  }>;
  text: string;
  selectedOption: string;
  containsSearch?: boolean;
  searchString?: string | null;
  filterOptions?: (searchValue: string) => any[];
}

const ProfileDropdown: FC<DropdownProps> = ({
  options : initOptions,
  text,
  selectedOption,
  containsSearch,
  searchString,
  filterOptions,
}: DropdownProps) => {

  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [options, setOptions] = useState<any[]>(initOptions);

  const onSearchChange = (value: string) => {
    setSearchValue(value || '');
    if (containsSearch) {
      const newOptions: any[] = filterOptions!(value);
      setOptions(newOptions);
    }
  }

  const onClear = () => {
    onSearchChange('');
  }

  return (
    <div 
      className="relative inline-block"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      {/** Trigger container */}
      <div className="w-fit flex flex-row gap-2 items-center hover:bg-gray-100 cursor-pointer px-4 py-2 rounded-md border border-gray-300">
        <p className="text-sm">{text}</p>
        <ArrowDropDownIcon 
          style={{ width: '22px', height: '22px' }}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-20 max-h-60 overflow-y-scroll min-w-48 max-w-96 bg-white border border-gray-200 rounded-none shadow-md">
          {containsSearch && (
            <StickySearchbar 
              searchValue={searchValue}
              onClear={onClear}
              onSearchChange={onSearchChange}
              searchString={searchString}
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

export default ProfileDropdown;