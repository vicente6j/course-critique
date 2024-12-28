'use server'
import { useProfile } from "./server-contexts/profile/provider";
import AverageOverTime from "./home/averageOverTime";
import { Footer } from "./shared/footer";
import Navbar from "./shared/navbar";
import { FC, useCallback } from "react";
import InfoIcon from '@mui/icons-material/Info';
import Banner from "./home/banner";
import { Button } from "@nextui-org/button";
import { signOut } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';

export interface HomePageProps {}

const Home: FC<HomePageProps> = ({}: HomePageProps) => {
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <Navbar />
        <div className="w-4/5 mx-auto my-8">
          <div className="flex flex-col gap-8">
            {/* <Banner /> */}
            <AverageOverTime />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;