'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CampaignIcon from '@mui/icons-material/Campaign';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

export interface BannerProps {}

const Banner: FC<BannerProps> = ({

}: BannerProps) => {

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [textHeight, setTextHeight] = useState<number>(0);
 
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  /**
   * Get the natural card height at every window resize.
   * e.g. two lines of text = 120px give or take
   */
  const updateHeights: () => void = useCallback(() => {
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

    if (textRef.current) {
      const height = textRef.current.scrollHeight;
      setTextHeight(height / fontSize);
    }
    if (cardRef.current) {
      const height = cardRef.current.scrollHeight;
      setCardHeight(height / fontSize);
    }
  }, [cardRef.current, textRef.current]);

  useEffect(() => {
    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, [updateHeights]);

  return (
    <div 
      className={`
        flex flex-col relative bg-gray-200 rounded-lg px-8 pt-4 pb-8
        transition-all duration-300 ease-in-out
      `}
      style={{
        maxHeight: collapsed ? '4.8rem' : `${cardHeight + 1}rem`
      }}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      ref={cardRef}
    >
      <div className="flex flex-row gap-8 items-center">
        <CampaignIcon 
          style={{ 
            width: '30px', 
            height: '28px' 
          }} 
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <p className="heading-sm font-semi-bold">Course Critique Update</p>
            <p className={`text-sm font-loose transition-all duration-300 ease-in-out`}>
              3/30/25
            </p>
          </div>
          <p 
            className={`
              text-sm max-w-[100%]
              transition-all duration-300 ease-in-out
            `}
            style={{
              visibility: collapsed ? 'hidden' : 'visible',
              opacity: collapsed ? 0 : '100',
              maxHeight: collapsed ? 0 : `${textHeight}rem`
            }}
            ref={textRef}
          >
            Welcome to an updated version of Course Critique! This version of Course Critique includes
            several new features:
            <br></br>
            - Course rankings<br></br>
            - Course & professor history<br></br>
            - A degree planner<br></br>
            - And more!<br></br>
            <br></br>
            
            If you have any questions or feedback, please don't hesitate
            to 
            <a 
              href="mailto:vmiranda6@gatech.edu" 
              target="_blank"
              className="text-blue-500 hover:text-blue-700"
            >
              {' '}reach out{' '}
            </a>
            to my gatech email or leave feedback 
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdzaegtAi1IE0QqtOPUGzMXzNOnsxk-h17CIykt66sn3E84lA/viewform?usp=header" 
              target="_blank"
              className="text-blue-500 hover:text-blue-700"
            > 
              {' '}here
            </a>.
          </p>
        </div>
      </div>
      <div className="flex flex-row gap-2 justify-end items-center absolute bottom-2 right-4">
        <MinimizeIcon 
          className="hover:scale-110 cursor-pointer"
          style={{ 
            width: '18px'
          }}
          onClick={() => {
            setCollapsed(true);
          }}
        />
        <OpenInFullIcon 
          className="hover:scale-110 cursor-pointer"
          style={{ 
            width: '18px'
          }}
          onClick={() => {
            setCollapsed(false);
          }}
        />
      </div>
    </div>
  );
}

export default Banner;