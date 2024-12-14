'use server'
import { redirect } from "next/navigation";
import { FC } from "react";
import SignInPage from "./signin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authConfig";
import { SessionProvider } from "next-auth/react";
import { Footer } from "@/app/shared/footer";
import Navbar from "@/app/shared/navbar";

export interface SignInProps {}

const SignIn: FC<SignInProps> = async ({

}: SignInProps) => {

  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <SignInPage />
      </div>
    </div>
  );
}

export default SignIn;