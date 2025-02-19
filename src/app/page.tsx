'use server'
import { Footer } from "./shared/footer";
import Navbar from "./shared/navbar";
import { FC } from "react"; 
import HomePageWrapper from "./home/homePageWrapper";

export interface HomePageProps {}

const Home: FC<HomePageProps> = ({

}: HomePageProps) => {
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <Navbar />
        <HomePageWrapper />
      </div>
      <Footer />
    </div>
  );
}

export default Home;