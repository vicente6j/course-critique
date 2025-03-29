import { FC } from "react";
import ShowDontShow from "../components/showDontShow";
import TermTable from "./termTable";

export interface HowToUseProps {}

const HowToUse: FC<HowToUseProps> = ({

}: HowToUseProps) => {

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <p className="heading-md w-fit">How to use</p>
        <ShowDontShow 
          showText="Show"
          hideText="Hide"
          whatToShow={
            <div className="flex flex-col gap-4">
              <p className="text-sm">
                The purpose of this degree planner is to help you construct the layout
                of your classes every semester. Under <span className="font-bold">Terms Selected{' '}</span> 
                above you can select the terms you'd like to include, e.g. Fall 2021. Below you'll see the 
                terms you select, along with a table which looks like what follows.
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
          }
        />  
      </div>
    </div>
  );
}

export default HowToUse;