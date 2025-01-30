import { FC } from "react";
import { Link } from "@nextui-org/react";

export interface RightHandPanelProps {

};

const RightHandPanel: FC<RightHandPanelProps> = ({

}: RightHandPanelProps) => {
  return (
    <div className="flex flex-col gap-4 w-[22%]">
      <div className="h-fit flex flex-col gap-4 bg-white p-8 shadow-md rounded-md">
        <h1 className="heading-sm font-loose">Other rankings</h1>
        <div className="flex flex-col gap-2">
          <Link 
            href="/rankings/prof"
            className="text-sm hover:underline cursor-pointer"
          >
            Hardest professors
          </Link>
        </div>
      </div>

    </div>
  )

}

export default RightHandPanel;