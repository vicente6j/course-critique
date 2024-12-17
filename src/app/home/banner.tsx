'use client'
import { FC } from "react";
import InfoIcon from '@mui/icons-material/Info';

export interface BannerProps {}

const Banner: FC<BannerProps> = ({

}: BannerProps) => {
  return (
    <div className="flex flex-row gap-4 border rounded-lg bg-levels-gray-blue p-4">
      <InfoIcon style={{ width: '20px' }} />
      <p className="text-sm">
        Welcome to the <span className="font-semi-bold">updated version</span> of Course Critique!
        I've had this idea to update Course Critique for a while now, and it's finally come together
        in a way that I think is quite cool {':)'} If you have suggestions on ideas or areas to 
        improve please don't hesitate to 
        <a 
          href="mailto:vmiranda6@gatech.edu" 
          target="_blank"
          className="text-blue-500"
        >
          {' '}reach out{' '}
        </a>
        to my personal email or leave feedback 
        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSdzaegtAi1IE0QqtOPUGzMXzNOnsxk-h17CIykt66sn3E84lA/viewform?usp=header" 
          target="_blank"
          className="text-blue-500"
        > 
          {' '}here
        </a>!  
      </p>
    </div>
  );
}

export default Banner;