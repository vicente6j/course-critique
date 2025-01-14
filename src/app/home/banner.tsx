'use client'
import { FC } from "react";
import InfoIcon from '@mui/icons-material/Info';

export interface BannerProps {}

const Banner: FC<BannerProps> = ({

}: BannerProps) => {
  return (
    <div className="flex flex-row gap-4 border rounded-lg bg-gray-200 p-4">
      <InfoIcon style={{ width: '20px' }} />
      <p className="text-sm">
        Welcome to an updated version of Course Critique! I think you'll enjoy
        this newer and hopefully improved version of the site. If you have any questions or feedback, please don't hesitate
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
  );
}

export default Banner;