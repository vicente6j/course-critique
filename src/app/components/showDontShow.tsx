import { Link } from "@nextui-org/link";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import HideSourceIcon from '@mui/icons-material/HideSource';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { hexToRgba } from "../utils";

export interface ShowDontShowProps {
  showText: string;
  hideText: string;
  showIcon?: React.ReactNode;
  hideIcon?: React.ReactNode;
  whatToShow: React.ReactNode;
}

const ShowDontShow: FC<ShowDontShowProps> = ({
  showText,
  hideText,
  showIcon,
  hideIcon,
  whatToShow,
}: ShowDontShowProps) => {

  const [show, setShow] = useState<boolean>(false);
  const [hoverShow, setHoverShow] = useState<boolean>(false);

  return (
    <div className="w-fit">
      {show ? (
        <div className="flex flex-col gap-2">
          <div 
            className="flex gap-2 items-center cursor-pointer w-fit"
            onMouseEnter={() => {
              setHoverShow(true);
            }}
            onMouseLeave={() => {
              setHoverShow(false);
            }}
            onClick={() => {
              setShow(false);
            }} 
          >
            <p className={`heading-xs ${hoverShow ? 'text-red-800' : 'text-[var(--color-red)]' } cursor-pointer`}>
              {hideText}
            </p>
            {hideIcon ?? (
              <HideSourceIcon 
                style={{ 
                  width: '24px', 
                  color: `${hoverShow ? 'var(--color-dark-red)' : 'var(--color-red)'}`,
                  transition: 'transform 0.2s' 
                }}
                className={`${hoverShow ? 'rotate-180' : ''}`}
              />
            )}
          </div>
          {whatToShow}
        </div>
      ) : (
        <div 
          className="flex gap-2 items-center cursor-pointer w-fit"
          onMouseEnter={() => {
            setHoverShow(true);
          }}
          onMouseLeave={() => {
            setHoverShow(false);
          }}
          onClick={() => {
            setShow(true);
          }} 
        >
          <p className={`heading-xs ${hoverShow ? 'text-gray-400' : 'text-gray-700' } cursor-pointer`}>
            {showText}
          </p>
          {showIcon ?? (
            <ViewModuleIcon 
              style={{ 
                width: '20px', 
                color: `${hoverShow ? hexToRgba('#9ca3af', 1) : '#374151'}`,
                transition: 'transform 0.2s' 
              }}
              className={`${hoverShow ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ShowDontShow;