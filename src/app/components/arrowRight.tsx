import { Link } from "@nextui-org/link";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useRouter } from "next/navigation";
import { FC, useState } from "react";

export interface ArrowRightProps {
  displayText: string;
  href: string;
  justify?: string;
}

const ArrowRight: FC<ArrowRightProps> = ({
  displayText,
  href,
  justify,
}: ArrowRightProps) => {

  const router = useRouter();
  const [arrowRight, setArrowRight] = useState<boolean>(false);

  return (
    <div className={`flex flex-row ${justify ? justify : 'justify-end'}`}>
      <div 
        className="flex flex-row gap-1"
        onClick={() => {
          router.push(href);
        }}
        onMouseEnter={() => {
          setArrowRight(true);
        }}
        onMouseLeave={() => {
          setArrowRight(false);
        }}
      >
        <Link 
          className={`text-sm w-fit float-right`}
          href={href}
        >
          {displayText}
        </Link>
        <div className={`transition ease-out duration-200 ${arrowRight ? 'translate-x-2' : ''}`}>
          <ArrowRightAltIcon 
            className="hover:cursor-pointer"
            style={{ 
              color: '#338ef7' 
            }} 
          />
        </div>
      </div>
    </div>
  )
}

export default ArrowRight;