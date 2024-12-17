import { FC, useState } from "react";

export interface DropdownProps {
  options: Array<{ 
    label: string;
    onClick: () => void;
  }>;
}

export const Dropdown: FC<DropdownProps> = ({
  options
}: DropdownProps) => {

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="relative inline-block">
      <button 
        className="border border-gray-400 bg-white cursor-pointer hover:bg-gray-200"
        onClick={() => {
          setIsOpen(true);
        }}
      />

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

export default Dropdown;