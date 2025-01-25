import { FC, useCallback, useMemo } from "react";
import ActionDropdown, { ActionDropdownOption } from "../components/actionDropdown";
import { useTermSelectionContext } from "../client-contexts/termSelectionContext";

export interface TermTableDropdownProps {
  term: string;
}

const TermTableDropdown: FC<TermTableDropdownProps> = ({
  term,
}: TermTableDropdownProps) => {

  const { handleUnselectTerm } = useTermSelectionContext();

  const options: ActionDropdownOption[] = useMemo(() => {
    return [
      { 
        label: 'Remove', 
        onClick: () => {
          handleUnselectTerm(term);
        }
      }
    ]; 
  }, []);

  return (
    <ActionDropdown 
      options={options}
    />
  )

}

export default TermTableDropdown;