import { FC, useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export interface AutoDropdown {
  options: Array<{ 
    label: string;
    onClick: () => void;
  }>;
  text: string;
}

const AutoDropdown: FC<AutoDropdown> = ({
  options,
  text,
}: AutoDropdown) => {

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => {
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        setIsOpen(false);
      }}
    >
      {/** Trigger container */}
      <div className="flex flex-row gap-1 items-center hover:bg-gray-100 px-2 py-1 rounded-md">
        <p className="text-sm">{text}</p>
        <KeyboardArrowDownIcon 
          style={{ width: '22px', height: '22px' }}
          className={`cursor-pointer p-0`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 z-10 w-fit bg-white border border-gray-200 rounded-none shadow-md">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick();
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm whitespace-nowrap"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutoDropdown;