'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CampaignIcon from '@mui/icons-material/Campaign';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

export interface BannerProps {}

/**
 * The way this works is there are two relative divs back to back, one being the card
 * component which displays the announcement, text, & controls, and the other being
 * an overlay which gives the impression that upon hover, the card is being expanded
 * to reveal the text.
 * 
 * You can achieve a number of effects via using opacity & etc, but with the overlay it gives the
 * distict impression of text being revealed which I particularly like. The issue is that you don't
 * want the overlay to overflow into upcoming components. So you truncate the height of the
 * parent div on both components to be the card height, and only expand it upon hover. Then, 
 * set the z-layer for the overlay to be something really small, just barely able to cover the text.
 * 
 * Card height & text heights used based on dynamic window size.
 * @param param0 
 * @returns banner component
 */
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
  }, []);

  useEffect(() => {
    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, [updateHeights]);

  return (
    <div 
      className="relative transition-all duration-300 ease-in-out"
      style={{
        maxHeight: collapsed ? '5rem' : `${cardHeight + 1}rem`,
      }}
    >
      <div 
        className={`
          flex flex-col relative bg-gray-200 rounded-lg px-8 pt-4 pb-8
          transition-all duration-300 ease-in-out
        `}
        style={{
          maxHeight: collapsed ? '5rem' : `${cardHeight + 1}rem`,
        }}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        ref={cardRef}
      >
        <div className="flex flex-row gap-8 items-center">
          <CampaignIcon 
            style={{ 
              width: '30px', 
              height: '28px',
              marginBottom: '5px'
            }} 
          />
          <div className="flex flex-col gap-3 relative">
            <div className="flex flex-col gap-1">
              <p className="heading-sm font-semi-bold">Course Critique Update</p>
              <p className={`text-sm font-loose transition-all duration-300 ease-in-out`}>
                3/30/25
              </p>
            </div>
            <p 
              className={`
                text-sm max-w-[100%]
                transition-all duration-300 ease-in-out z-1
              `}
              ref={textRef}
              style={{
                maxHeight: collapsed ? '0' : `${textHeight}rem`, /** Allows the overlay to cover it completely */
                visibility: collapsed ? 'hidden' : 'visible' /** Removes bug with overflowing into table */
              }}
            >
              Welcome to an updated version of Course Critique! This version of Course Critique includes
              several new features:
              <br></br>
              - Course rankings<br></br>
              - Course & professor history<br></br>
              - A degree planner<br></br>
              - Faster page loads<br></br>
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
      <div 
        className={`
          max-w-[100%] w-[100%] transition-all duration-300 ease-in-out z-2 bottom-0
          bg-hex 
        `}
        style={{
          height: `${textHeight}rem`,
          transform: 'translateY(0)',
        }}
      />
    </div>
  );
}

export default Banner;