'use client'
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Button, DropdownItem, DropdownMenu, DropdownTrigger, Spinner } from "@nextui-org/react";
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchBar from "./searchbar";
import Dropdown from "./autoDropdown";

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
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (session && session.status === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, [session]);

  const rankingsOptions: Array<{ 
    label: string;
    onClick: () => void;
  }> = useMemo(() => {
    return [
      {
        label: 'Hardest Courses',
        onClick: () => {
          router.push('/rankings');
        }
      }, {
        label: 'Hardest Professors',
        onClick: () => {
          router.push('/rankings');
        }
      }
    ]
  }, []);

  return (
    <div className="w-full border border-bottom border-gray bg-white">
      <div className="w-4/5 mx-auto py-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row items-center gap-8">
            <div className="flex flex-col gap-0">
              <Link href="/" className="heading-md">Course Critique</Link>
              <p className="text-xs">A Georgia Tech project</p>
            </div>
            <SearchBar />
            <div className="flex flex-row items-center gap-0.5">
              <Dropdown 
                text={'Rankings'}
                options={rankingsOptions}
              />
            </div>
          </div>
          <div className="flex flex-row gap-8 items-center">
            {session ? (
              <>
                <Link 
                  href="/degree-plan" 
                  className="text-sm hover:text-gray-600 cursor-pointer"
                >
                  Degree Plan
                </Link>
                <div
                  onClick={() => {
                    router.push(`/profile`);
                  }}
                  className="cursor-pointer hover:bg-dark-light p-1"
                >
                  <PersonIcon />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar;