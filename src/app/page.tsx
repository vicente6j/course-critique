import { useProfile } from "./contexts/profile/provider";
import AverageOverTime from "./shared/averageOverTime";
import { Footer } from "./shared/footer";
import Navbar from "./shared/navbar";
import { FC } from "react";

export interface HomePageProps {}

const Home: FC<HomePageProps> = ({}: HomePageProps) => {
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <Navbar />
        <div className="w-4/5 mx-auto mt-8">
          <AverageOverTime />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;