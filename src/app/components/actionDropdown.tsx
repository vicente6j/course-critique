import { FC, useState } from "react";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export type DropdownType = 'auto' | 'trigger';

export interface ActionDropdownOption {
  label: string;
  id: string;
  onClick: () => void;
  customIcon?: React.ReactNode;
}

export interface ActionDropdownProps {
  options: ActionDropdownOption[];
  type: DropdownType;
  trigger?: React.ReactElement;
  text?: string;
}

const ActionDropdown: FC<ActionDropdownProps> = ({
  options,
  type,
  trigger,
  text,
}: ActionDropdownProps) => {
  
  const [isOpen, setIsOpen] = useState<boolean>(false);

  /**
   * It might have been possible to combine the auto & trigger states into
   * one cohesive dropdown, but I dislike the scalability there, so we'll for now
   * instantitate dropdown types for different dropdown effects.
   * 1. auto --> auto dropdown (assumes text is instantiated)
   * 2. trigger -> must click on a trigger to open a dropdown, e.g. 3-dots
   */
  if (type === 'auto') {
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
        <div className="flex flex-row items-center gap-2 items-center hover:bg-gray-100 px-2 py-1 rounded-md">
          {trigger ?? trigger}
          <p className="text-sm">{text}</p>
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
                className="flex flex-row gap-2 items-center w-full px-4 py-2 text-left hover:bg-gray-100 text-sm whitespace-nowrap"
              >
                {option.customIcon ?? option.customIcon}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  } else if (type === 'trigger') {
    return (
      <div 
        className="relative inline-block"
      >
        <div 
          onClick={() => {
            setIsOpen(true);
          }}
        >
          {trigger ?? (
            <MoreVertIcon 
              style={{ width: '16px', height: '16px' }}
              className={`cursor-pointer p-0 hover:bg-gray-200`}
            />
          )}
        </div>
  
        {isOpen && (
          <div className="absolute left-0 z-10 w-fit bg-white border border-gray-200 rounded-md shadow-lg">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false);
                }}
                className="block w-fit px-4 py-2 text-left hover:bg-gray-100 text-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
  
        {isOpen && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }
}

export default ActionDropdown;