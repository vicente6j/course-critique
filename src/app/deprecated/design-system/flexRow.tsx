import { FC } from "react";

interface FlexRowProps {
  children?: React.ReactNode;
  alignItems?: string;
  marginTop?: string;
  flexWrap?: string;
  gap?: string;
}

const FlexRow: FC<FlexRowProps> = ({
  children, 
  alignItems,
  marginTop,
  flexWrap,
  gap,
}: FlexRowProps) => {
  return (
    <div className={`flex flex-row ${gap ? gap : ''} ${alignItems ? alignItems : ''} ${marginTop ? marginTop : ''} ${flexWrap ? flexWrap: ''}`}>
      {children}
    </div>
  )
}

export default FlexRow;