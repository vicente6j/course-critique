'use client'
import { FC } from "react";
import { Footer } from "@/app/shared/footer";
import Navbar from "@/app/shared/navbar";
import ProfilePageClient from "./client";

export interface ProfilePageProps {}

const ProfilePage: FC<ProfilePageProps> = ({

}: ProfilePageProps) => {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <ProfilePageClient />
      </div>
      <Footer />
    </div>
  );
}

export default ProfilePage;