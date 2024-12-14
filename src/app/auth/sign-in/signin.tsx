'use client'
import { Button, Input, Link } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { FC, useCallback } from "react";
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';

export interface SignInPageProps {}

export const SignInPage: FC<SignInPageProps> = ({

}: SignInPageProps) => {

  const handleGoogleSignIn: () => Promise<void> = useCallback(async () => {
    try {
      await signIn('google');
    } catch (error) {
      console.error('error signing in with google', error);
    }
  }, []);

  return (
    <div className="w-4/5 mx-auto mt-8">
      <div className="w-300 mx-auto">
        <div className="flex flex-col gap-6">
          <h1 className="heading-md">Sign in</h1>
          <div className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="Email address"
              labelPlacement="outside"
            />
            <Input
              type="password"
              label="Password"
              placeholder="Password"
              labelPlacement="outside"
            />
            <Button 
              color="default" 
              onClick={handleGoogleSignIn} 
              className="bg-prussian-blue fit-content" 
              style={{ color: 'var(--background-hex)' }}
            >
              Sign in
            </Button>
            <p className="text-sm text-center">
              Don't have an account? Sign up {' '}
              <Link href="/auth/sign-up" className="font-sm cursor-pointer hover:underline">
                here
              </Link>.
            </p>
          </div>
          <p className="relative w-full text-center text-sm text-gray-400">
            <span className="absolute left-0 top-[50%] w-2/5 h-px bg-gray-300"></span>
            OR
            <span className="absolute right-0 top-[50%] w-2/5 h-px bg-gray-300"></span>
          </p>
          <Button 
            color="default" 
            onClick={handleGoogleSignIn} 
            className="bg-google fit-content" 
            startContent={<GoogleIcon />}
            style={{ color: 'var(--background-hex)' }}
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;