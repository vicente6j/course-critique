import { Dispatch, FC, SetStateAction, useState } from "react"

export interface CheckboxProps {
  checked: boolean;
  setChecked: Dispatch<SetStateAction<boolean>>;
  checkboxLabel?: string;
}

const Checkbox: FC<CheckboxProps> = ({
  checked,
  setChecked,
  checkboxLabel,
}: CheckboxProps) => {

  return (
    <div 
      className="flex flex-row gap-2 items-center cursor-pointer"
      onClick={(e) => setChecked(!checked)}
    >
      <div className="flex gap-2 relative">
        <input 
          type="checkbox" 
          id="differential-checkbox" 
          className="
            relative peer shrink-0 
            appearance-none w-4 h-4 border border-gray-300 
            rounded-md bg-white checked:bg-blue-500 checked:border-0
            cursor-pointer focus:outline-none focus:ring-offset-0
          "
          checked={checked}
        />
        <svg
          className="
            absolute 
            w-3 h-3
            hidden peer-checked:block
            pointer-events-none
            left-0.5 top-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <p className="text-sm text-gray-500">{checkboxLabel}</p>
    </div>
  );
}

export default Checkbox