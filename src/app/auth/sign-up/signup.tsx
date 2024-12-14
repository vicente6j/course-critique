'use client'
import { Button, Input, Link } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { FC, useCallback } from "react";
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';

export interface SignInPageProps {}

export const SignUpPage: FC<SignInPageProps> = ({

}: SignInPageProps) => {

  return (
    <div className="w-4/5 mx-auto mt-8">
      <div className="w-300 mx-auto">
        <div className="flex flex-col gap-6">
          <h1 className="heading-md">Sign up</h1>
          <div className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="Enter email..."
              labelPlacement="outside"
            />
            <Input
              type="password"
              label="Password"
              placeholder="Enter a password..."
              labelPlacement="outside"
            />
            <Button 
              color="default" 
              className="bg-prussian-blue fit-content" 
              style={{ color: 'var(--background-hex)' }}
            >
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;