import { FC } from "react";
import { useTermSelection } from "../hooks/useTermSelection";
import TermTable from "./termTable";

export interface TermGridProps {}

const TermGrid: FC<TermGridProps> = ({

}: TermGridProps) => {

  const {
    termsSelected,
  } = useTermSelection();
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-8 gap-x-8 text-md min-h-800">
      {termsSelected?.map((term) => {
        return (
          <div key={`${term}`} className="flex flex-col gap-2 w-full">
            <TermTable term={term}/>
          </div>
        );
      })}
    </div>
  );
}

export default TermGrid;