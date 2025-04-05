'use client'
import { FC, useCallback, useEffect, useRef, useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import CustomSearchbar from "../shared/customSearchbar";
import { useHoverContext } from "../contexts/client/hover";

export interface SelectionOption {
  label: string | React.ReactNode;
  id: string;
  onClick?: () => void;
}

export interface SelectionDropdownProps {
  options: SelectionOption[];
  selectedOption: string; /** Represents the ID of the option selected, NOT the label */
  text?: string; /** Text which is shown when the dropdown isn't expanded/at the top */
  customTrigger?: React.ReactNode;
  containsSearch?: boolean;
  searchString?: string | null; /** If the dropdown contains search, optional placeholder text for the search query */
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

  /** Need a separate state for options because this might change with a search query */
  const [options, setOptions] = useState<any[]>(initOptions);

  const {
    setAboveDropdown
  } = useHoverContext();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const onSearchChange: (value: string) => void = useCallback((value) => {
    setSearchValue(value || '');
    if (containsSearch) {
      const newOptions: any[] = filterType ? filterOptions!(value, filterType) : filterOptions!(value);
      setOptions(newOptions);
    }
  }, []);

  const onClear: () => void = useCallback(() => {
    onSearchChange('');
  }, []);

  const exitDropdown: () => boolean = useCallback(() => {
    try {
      setIsOpen(false);
      onClear();
      setAboveDropdown(false);
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }, []);

  return (
    <div 
      className="relative inline-block w-fit"
      style={{
        zIndex: 8,
      }}
      onClick={() => {
        setIsOpen(true);
      }}
    >
      {/** Trigger container */}
      {customTrigger ? (
        customTrigger
      ) : (
        <div className="flex flex-row gap-2 items-center border border-gray-400 w-fit px-4 py-1 rounded-md cursor-pointer hover:bg-gray-100">
          <p className="text-sm">{text}</p>
          <ArrowDropDownIcon 
            style={{ 
              width: '22px', 
              height: '22px' 
            }}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      )}
      {isOpen && (
        <div 
          className="
            absolute top-[calc(100%+4px)] left-0 z-20 max-h-60 overflow-y-scroll min-w-48 max-w-96 bg-white 
            border border-gray-200 rounded-lg shadow-md selection-dropdown
          "
          ref={dropdownRef}
          onMouseEnter={() => setAboveDropdown(true)}
          onMouseLeave={() => setAboveDropdown(false)}
        >
          {containsSearch && (
            <CustomSearchbar 
              searchValue={searchValue}
              onClear={onClear}
              onSearchChange={onSearchChange}
              searchString={searchString}
              variation="sticky"
            />
          )}
          {options.map((option) => (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation();
                option.onClick();
                exitDropdown();
              }}
              className={`${selectedOption === option.id ? 'bg-gray-100' : ''} 
                block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm
                selection-dropdown-option
              `}
            >
              {selectedOption === option.id ? 
                <div className="p-0 w-full flex flex-row justify-between gap-4 items-center">
                  {option.label}
                  <CheckIcon 
                    style={{ 
                      width: '14px' 
                    }}
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
            exitDropdown();
          }}
        />
      )}
    </div>
  );
}

export default SelectionDropdown;