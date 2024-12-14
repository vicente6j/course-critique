import { FC } from "react";

interface FlexColProps {
  children?: React.ReactNode;
}

const FlexCol: FC<FlexColProps> = ({
  children, 
}: FlexColProps) => {
  return (
    <div className="flex flex-col justify-center gap-4">
      {children}
    </div>
  )
}

export default FlexCol;