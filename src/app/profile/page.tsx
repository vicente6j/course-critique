'use client'
import { FC } from "react";
import { Footer } from "@/app/shared/footer";
import Navbar from "@/app/navigation/navbar";
import ProfilePageClient from "./client";
import { ProfileContextProvider } from "../contexts/client/profile";

export interface ProfilePageProps {}

const ProfilePage: FC<ProfilePageProps> = ({

}: ProfilePageProps) => {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <ProfileContextProvider>
          <ProfilePageClient />
        </ProfileContextProvider>
      </div>
      <Footer />
    </div>
  );
}

export default ProfilePage;