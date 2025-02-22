'use client'
import { FC } from "react"
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import NavSearchbar from "./navSearchbar";
import RankingsDropdown from "./rankingsDropdown";
import { Link } from "@nextui-org/react";
import SchoolIcon from '@mui/icons-material/School';

export interface NavbarProps {}
const Navbar: FC<NavbarProps> = ({

}: NavbarProps) => {


  /** 
   * If we use our custom useSession hook, there's a small performance improvement
   * where upon an initial render, the session is immediately evaluated as null 
   * rather than being undefined (server level caching involved here, very moderate
   * change).
   * 
   * Also just justifies having made it. But it doesn't matter.
  */
  const session = useSession();

  return (
    <div className="w-full border border-bottom border-gray bg-white">
      <div className="w-4/5 mx-auto py-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row items-center gap-8">
            <div className="flex flex-col gap-0">
              <Link 
                href="/" 
                className="heading-md text-black"
              >
                Course Critique
              </Link>
            </div>
            <NavSearchbar />
            <RankingsDropdown />
          </div>
          {session ? (
            <div className="flex flex-row gap-8 items-center">
              <Link
                href="/degree-plan"
                className="block rounded-md px-2 py-1 text-left hover:bg-gray-100 text-sm text-black flex flex-row gap-2 items-center whitespace-nowrap"
              >
                <SchoolIcon 
                  style={{
                    width: '20px'
                  }}
                />
                <p>Degree Plan</p>
              </Link>
              <Link
                href="/profile"
                className="block rounded-md p-1 hover:bg-gray-100"
              >
                <PersonIcon 
                  style={{
                    width: '20px',
                    color: 'black'
                  }}
                />
              </Link>
            </div>
          ) : (
            <div className="flex flex-row gap-8 items-center">
              <Link 
                href="/auth/sign-in" 
                className="heading-xs hover:text-gray-600 cursor-pointer text-sm bg-light p-2 px-4 rounded hover:bg-dark-light"
              >
                Sign in
              </Link>
              <Link 
                href="/auth/sign-up" 
                className="heading-xs text-sm cursor-pointer p-2 bg-levels white rounded px-4 hover:bg-levels-light"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar;