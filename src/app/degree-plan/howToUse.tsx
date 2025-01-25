import { FC, useState } from "react";
import HideSourceIcon from '@mui/icons-material/HideSource';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TermTable from "./termTable";

export interface HowToUseProps {}

const HowToUse: FC<HowToUseProps> = ({

}: HowToUseProps) => {

  const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
  const [hoverHowToUse, setHoverHowToUse] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-8 items-center">
        <p className="heading-md">How to use</p>
        {showHowToUse ? (
          <div 
            className="flex gap-2 items-center cursor-pointer"
            onMouseEnter={() => {
              setHoverHowToUse(true);
            }}
            onMouseLeave={() => {
              setHoverHowToUse(false);
            }}
            onClick={() => {
              setShowHowToUse(false);
            }} 
          >
            <p className={`heading-sm ${hoverHowToUse ? 'text-red-800' : 'text-[var(--color-red)]' } cursor-pointer`}>
              Hide
            </p>
            <HideSourceIcon 
              style={{ width: '24px', color: `${hoverHowToUse ? 'var(--color-dark-red)' : 'var(--color-red)'}` }}
              className={`transition-transform ${hoverHowToUse ? 'rotate-180' : ''}`}
            />
          </div>
        ) : (
          <div 
            className="flex gap-2 items-center cursor-pointer"
            onMouseEnter={() => {
              setHoverHowToUse(true);
            }}
            onMouseLeave={() => {
              setHoverHowToUse(false);
            }}
            onClick={() => {
              setShowHowToUse(true);
            }} 
          >
            <p className={`heading-sm ${hoverHowToUse ? 'text-green-800' : 'text-[var(--color-light-green)]' } cursor-pointer`}>
              Show
            </p>
            <VisibilityIcon 
              style={{ width: '24px', color: `${hoverHowToUse ? 'var(--color-dark-green)' : 'var(--color-light-green)'}` }}
              className={`transition-transform ${hoverHowToUse ? 'rotate-180' : ''}`}
            />
          </div>
        )}
      </div>
      {showHowToUse ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            The purpose of this degree planner is to help you construct the layout
            of your classes every semester. Above you can select the terms you'd like to include,
            e.g. Fall 2021. Below you'll see the terms you select, along with a table which looks like
            what follows.
          </p>
          <TermTable term={'Example'}/>
          <p className="text-sm">
            Notice that the table allows you to add courses as you wish. The dropdown at the top additionally
            allows you to select a schedule on which to begin saving courses. If you have no schedule selected,
            nothing will be saved; but if you create a schedule and add courses to it, they'll be saved to your account.
            You can use a schedule in whichever term you want.
            Lastly, notice that you can additionally assign grades to courses in your schedule. These are term-specific.
            i.e. assigning a grade in a schedule in one term won't automatically assign the same grade to the same schedule
            in a different term.
          </p>
        </div>
      ) : (
        <p className="text-sm">
          Demonstration of how to use the degree planner.
        </p>
      )}
    </div>
  )

}

export default HowToUse;