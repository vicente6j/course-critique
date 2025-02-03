'use client'
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link";
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchBar from "./searchbar";
import ActionDropdown, { ActionDropdownOption } from "../components/actionDropdown";
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RankingsDropdown from "./rankingsDropdown";

export interface NavbarProps {}
const Navbar: FC<NavbarProps> = ({

}: NavbarProps) => {

  /**
   * Pre-release v1.0 -- no router or session hooks, as there is no 
   * sign on functionality enabled.
   */

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
            <RankingsDropdown />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar;