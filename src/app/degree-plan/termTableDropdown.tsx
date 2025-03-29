import { FC, useCallback, useMemo } from "react";
import ActionDropdown, { ActionDropdownOption } from "../components/actionDropdown";
import { useTermSelectionContext } from "../hooks/termSelection/termSelectionContext";

export interface TermTableDropdownProps {
  term: string;
}

const TermTableDropdown: FC<TermTableDropdownProps> = ({
  term,
}: TermTableDropdownProps) => {

  const {
    handlers
  } = useTermSelectionContext();

  const options: ActionDropdownOption[] = useMemo(() => ([
    { 
      label: 'Remove', 
      id: 'remove',
      onClick: () => {
        handlers.handleUnselectTerm(term);
      }
    }
  ]), []);

  return (
    <ActionDropdown 
      type={'trigger'}
      options={options}
    />
  )

}

export default TermTableDropdown;