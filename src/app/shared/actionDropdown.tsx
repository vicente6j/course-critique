import { FC, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface ActionDropdownProps {
  options: Array<{ 
    label: string;
    onClick: () => void;
  }>;
  trigger: React.ReactElement;
}

const ActionDropdown: FC<ActionDropdownProps> = ({
  options,
  trigger,
}: ActionDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div className="relative inline-block">
      <div 
        onClick={() => {
          setIsOpen(true);
        }}
      >
        {trigger}
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

export default ActionDropdown;