import { FC } from "react"
import FlexRow from "../shared/flexRow";

interface ColorSquareProps {
  bgColor: string;
}

const ColorSquare: FC<ColorSquareProps> = ({
  bgColor
}: ColorSquareProps) => {
  return (
    <div className="w-200">
      <FlexRow alignItems="items-center">
        <div className={`color-square ${bgColor}`}></div>
        <p className="text-md">{bgColor}</p>
      </FlexRow>
    </div>
  )
}

export default ColorSquare;