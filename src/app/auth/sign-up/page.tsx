'use server'
import { redirect } from "next/navigation";
import { FC } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authConfig";
import { SessionProvider } from "next-auth/react";
import { Footer } from "@/app/shared/footer";
import Navbar from "@/app/shared/navbar";
import SignUpPage from "./signup";

export interface SignUpProps {}

const SignUp: FC<SignUpProps> = async ({

}: SignUpProps) => {

  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <SignUpPage />
      </div>
    </div>
  );
}

export default SignUp;