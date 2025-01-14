'use client'
import { FC } from "react";
import { Input } from "@nextui-org/input";
import { SearchIcon } from "../../../public/icons/searchIcon";

export type SearchVariation = 'regular' | 'sticky';

export interface CustomSearchbarProps {
  searchValue: string | null;
  onClear: () => void;
  onSearchChange: (value: string) => void;
  searchString?: string | null;
  variation?: SearchVariation;
}

const CustomSearchbar: FC<CustomSearchbarProps> = ({
  searchValue,
  onClear,
  onSearchChange,
  searchString,
  variation,
}: CustomSearchbarProps) => {

  if (variation === 'regular') {
    return (
      <Input
        isClearable
        variant="bordered"
        classNames={{
          base: "w-full sm:max-w-[44%]",
          inputWrapper: "border-1 border-gray-300 data-[hover=true]:border-default-300 group-data-[focus=true]:border-default-400 rounded-md shadow-none",
        }}
        placeholder={searchString ?? 'Search'}
        startContent={<SearchIcon />}
        value={searchValue || ''}
        onClear={onClear}
        onValueChange={onSearchChange}
      />
    );
  } 

  return (
    <div className="py-1 sticky top-0 bg-white z-10">
      <Input
        isClearable
        variant="bordered"
        classNames={{
          inputWrapper: "border-1 border-t-0 border-r-0 border-l-0 rounded-none data-[hover=true]:border-default-200 group-data-[focus=true]:border-default-200",
        }}
        placeholder={searchString ?? 'Search'}
        startContent={<SearchIcon />}
        value={searchValue || ''}
        onClear={onClear}
        onValueChange={onSearchChange}
      />
    </div>
  );
}

export default CustomSearchbar;