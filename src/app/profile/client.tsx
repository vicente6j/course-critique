'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Button, SharedSelection, Spinner } from "@nextui-org/react";
import LogoutIcon from '@mui/icons-material/Logout';
import { Input } from "@nextui-org/input";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { SearchIcon } from "../../../public/icons/searchIcon";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { useProfile } from "../server-contexts/profile/provider";
import { useDegreePrograms } from "../server-contexts/degree-programs/provider";
import { DegreeProgram } from "../api/degree-programs";
import { updateProfileField } from "../api/profile";
import { Skeleton } from "@nextui-org/skeleton";
import Dropdown, { SelectionOption } from "../shared/selectionDropdown";
import { DegreeProgramType } from "../globalTypes";
import { formatDate } from "../utils";

export const suffixDict: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th'
};

export interface DropdownMenuItem {
  key: string;
  label: string;
}

const yearItems: DropdownMenuItem[] = [
  { key: 'Select a year', label: 'Select a year', },
  { key: '1st year', label: '1st year', },
  { key: '2nd year', label: '2nd year', },
  { key: '3rd year', label: '3rd year', },
  { key: '4th year', label: '4th year', }
];

export interface ProfilePageClientProps {}

const ProfilePageClient: FC<ProfilePageClientProps> = ({

}: ProfilePageClientProps) => {

  const [selectedYear, setSelectedYear] = useState<string>('Select a year');
  const [selectedDegreeProgram, setSelectedDegreeProgram] = useState<string>('Select a degree program');
  const [selectedSecondaryDegreeProgram, setSelectedSecondaryDegreeProgram] = useState<string>('Select a secondary degree program');
  const [selectedMinorProgram, setSelectedMinorProgram] = useState<string>('Select a minor');
  const [level, setLevel] = useState<string>('Not specified');
  const [createdAt, setCreatedAt] = useState<string>('');

  const { 
    data,
    maps,
    loading: degreesLoading
  } = useDegreePrograms();

  const { 
    profile 
  } = useProfile();

  const checkLevel: (program: DegreeProgram) => string = useCallback((program) => {
    return program.id.includes('-bs') ? 'Undergraduate' : 'Graduate';
  }, []);

  const fetchFromProfile: () => void = useCallback(async () => {
    if (!profile || !maps.degreePrograms) {
      return;
    }
    const year = profile.year;
    if (year) {
      setSelectedYear(year.toString());
    }
    const degree = profile.degree_program;
    if (degree && maps.degreePrograms.has(degree)) {
      setSelectedDegreeProgram(degree);
      const level = checkLevel(maps.degreePrograms.get(degree)!)
      setLevel(level);
    }
    const secondaryDegree = profile.secondary_degree_program;
    if (secondaryDegree && maps.degreePrograms.has(secondaryDegree)) {
      setSelectedSecondaryDegreeProgram(secondaryDegree);
    }
    const minor = profile.minor_program;
    if (minor && maps.degreePrograms.has(minor)) {
      setSelectedMinorProgram(minor);
    }
    const createdAt = profile.created_at;
    setCreatedAt(createdAt);
  }, [profile, maps.degreePrograms]);

  useEffect(() => {
    fetchFromProfile();
  }, [fetchFromProfile]); 
  
  const nonMinorItems: DegreeProgram[] = useMemo(() => {
    if (!data.degreePrograms) {
      return [];
    }
    return data.degreePrograms.filter(degreeProgram => {
      return !degreeProgram.id.includes('minor');
    });
  }, [data.degreePrograms]);

  const minorItems: DegreeProgram[] = useMemo(() => {
    if (!data.degreePrograms) {
      return [];
    }
    return data.degreePrograms.filter(degreeProgram => {
      return degreeProgram.id.includes('minor');
    });
  }, [data.degreePrograms]);
  
  const handleSignOut: () => Promise<void> = useCallback(async () => {
    await signOut({
      redirect: true,
      callbackUrl: '/',
    });
  }, []);

  const handleYearChange: (year: number) => void = useCallback(async (year) => {
    setSelectedYear(String(year));
    const numericalYear = Number(year);
  }, [profile!.id]);

  /**
   * Supports updating the degree program as well as the level of the user
   * (i.e. undergraduate or graduate).
   */
  const handleDegreeProgramChange: (program: DegreeProgram) => void = useCallback(async (program) => {
    setSelectedDegreeProgram(program.name);
    const level = checkLevel(maps.degreePrograms?.get(program.id)!);
    setLevel(level); 
  }, [maps.degreePrograms]);

  const handleSecondaryDegreeProgramChange: (program: DegreeProgram) => void = useCallback(async (program) => {
    setSelectedSecondaryDegreeProgram(program.name);
  }, [profile?.id]);

  const handleMinorProgramChange: (program: DegreeProgram) => void = useCallback(async (program) => {
    setSelectedMinorProgram(program.name);
  }, [profile?.id]);

  const yearOptions: SelectionOption[] = useMemo(() => {
    const select = {
      label: 'Select a year',
      id: 'select',
      onClick: () => {
        setSelectedYear('');
      }
    };
    const years = [1, 2, 3, 4].map(year => ({
      label: String(year),
      id: String(year),
      onClick: () => handleYearChange(Number(year))
    }));

    return [select, ...years];
  }, []);

  const filterDegreePrograms: (searchValue: string, type: DegreeProgramType) => SelectionOption[] = useCallback((searchValue, type) => {
    if (!nonMinorItems) {
      return [];
    }
    let filteredItems: any[] = nonMinorItems;
    if (searchValue && searchValue !== '') { /** If search value is a real string, remove 'select' option */
      const tokens: string[] = searchValue.split(' ');
      if (tokens.length <= 2) {
        filteredItems = nonMinorItems.filter((item: DegreeProgram) => {
          return item.name.toLowerCase().includes(searchValue);
        });
      } else {
        /** 
         * If we compute that the number of tokens is larger than 2,
         * ensure that every token is present (without regard to order),
         * AND that the first two tokens are present as is.
         */
        const firstTwoTokens = searchValue.substring(0, searchValue.indexOf(' ', searchValue.indexOf(' ') + 1));
        filteredItems = nonMinorItems.filter((item: DegreeProgram) => {
          return tokens.every(token => item.name.toLowerCase().includes(token)) && item.name.toLowerCase().includes(firstTwoTokens);
        });
      }
    } else {
      filteredItems = [
        type === 'primary' ? 'Select a degree program' : 'Select a secondary degree program',
        ...filteredItems,
      ];
    }

    const selectText = type === 'primary' ? 'Select a degree program' : 'Select a second degree program';
    const select = {
      label: selectText,
      id: selectText,
      onClick: () => {
        if (type === 'primary') {
          setSelectedDegreeProgram(selectText);
        } else {
          setSelectedSecondaryDegreeProgram(selectText);
        }
      }
    }
    const degreeItems = filteredItems.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.name,
      onClick: () => {
        if (type === 'primary') {
          handleDegreeProgramChange(program);
        } else {
          handleSecondaryDegreeProgramChange(program);
        }
      }
    }));
    return [select, ...degreeItems];
  }, [nonMinorItems]);

  const degreeProgramOptions: SelectionOption[] = useMemo(() => {
    if (!nonMinorItems) {
      return [];
    }

    const select = {
      label: 'Select a degree program',
      id: 'select',
      onClick: () => setSelectedDegreeProgram('Select a degree program')
    };
    const initOptions = nonMinorItems.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.name,
      onClick: () => handleDegreeProgramChange(program),
    }));

    return [select, ...initOptions];
  }, [nonMinorItems]);

  const secondaryDegreeProgramOptions: SelectionOption[] = useMemo(() => {
    if (!nonMinorItems) {
      return [];
    }
    const select = {
      label: 'Select a secondary degree program',
      id: 'select',
      onClick: () => setSelectedSecondaryDegreeProgram('Select a secondary degree program')
    };
    const initOptions = nonMinorItems.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.name,
      onClick: () => handleSecondaryDegreeProgramChange(program),
    }));

    return [select, ...initOptions];
  }, [nonMinorItems]);

  const filterMinorProgramOptions: (searchValue: string) => SelectionOption[] = useCallback((searchValue) => {
    if (!minorItems) {
      return [];
    }
    let filteredMinors: any[] = minorItems;
    if (searchValue && searchValue !== '') {
      filteredMinors = minorItems.filter((item: DegreeProgram) => {
        return item.name.toLowerCase().includes(searchValue);
      });
    }
    const select = {
      label: 'Select a minor',
      id: 'Select a minor',
      onClick: () => setSelectedMinorProgram('Select a minor')
    };
    const filteredOptions = filteredMinors.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.name,
      onClick: () => handleMinorProgramChange(program)
    }));
    return [select, ...filteredOptions];
  }, [minorItems]);

  const minorProgramOptions: SelectionOption[] = useMemo(() => {
    if (!minorItems) {
      return [];
    }
    const select = {
      label: 'Select a minor',
      id: 'Select a minor',
      onClick: () => setSelectedMinorProgram('Select a minor')
    };
    const filteredOptions = minorItems.map((program: DegreeProgram) => ({
      label: program.name,
      id: program.name,
      onClick: () => handleMinorProgramChange(program)
    }));
    return [select, ...filteredOptions];
  }, [minorItems]);

  return (
    <div className="flex-grow w-4/5 mx-auto">
      <div className="my-8 p-8 rounded bg-white flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="heading-md">{profile?.name}</h1>
          <p className="text-md text-gray-400">Signed in with {profile?.provider} ({profile?.email})</p>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-10 text-md items-center">
          <p className="text-md">Year</p>
          <Skeleton isLoaded={!degreesLoading} className="w-full inline-block max-w-96">
            <Dropdown 
              options={yearOptions}
              text={selectedYear === 'Select a year' ? 'Select a year' : `${suffixDict[parseInt(selectedYear)]} year`}
              selectedOption={selectedYear}
            />
          </Skeleton>

          <div className="flex flex-row gap-2">
            <p className="text-md">Level</p>
            <NextToolTip content={'Inferred from your primary degree program.'}>
              <InfoIcon style={{ width: '18px' }} />
            </NextToolTip>
          </div>
          <p className="text-sm">{level}</p>

          <p className="text-md">Degree Program</p>
          <Skeleton isLoaded={!degreesLoading} className="w-full inline-block max-w-96">
            <Dropdown 
              options={degreeProgramOptions}
              text={selectedDegreeProgram}
              selectedOption={selectedDegreeProgram}
              containsSearch={true}
              searchString={'Search for a degree program...'}
              filterOptions={filterDegreePrograms}
              filterType={'primary'}
            />
          </Skeleton>

          <div className="flex flex-row gap-2">
            <p className="text-md">Secondary degree program</p>
            <NextToolTip content={'This is totally option, if you want to add a double major for e.g.'}>
              <InfoIcon style={{ width: '18px' }} />
            </NextToolTip>
          </div>
          <Skeleton isLoaded={!degreesLoading} className="w-full inline-block max-w-96">
            <Dropdown 
              options={secondaryDegreeProgramOptions}
              text={selectedSecondaryDegreeProgram}
              selectedOption={selectedSecondaryDegreeProgram}
              containsSearch={true}
              searchString={'Search for a degree program...'}
              filterOptions={filterDegreePrograms}
              filterType={'secondary'}
            />
          </Skeleton>

          <div className="flex flex-row gap-2">
            <p className="text-md">Minor</p>
            <NextToolTip content={'This is also optional.'}>
              <InfoIcon style={{ width: '18px' }} />
            </NextToolTip>
          </div>
          <Skeleton isLoaded={!degreesLoading} className="w-full inline-block max-w-96">
            <Dropdown 
              options={minorProgramOptions}
              text={selectedMinorProgram}
              selectedOption={selectedMinorProgram}
              containsSearch={true}
              searchString={'Search for a minor...'}
              filterOptions={filterMinorProgramOptions}
            />
          </Skeleton>

          <p className="text-md">Created at</p>
          <Skeleton isLoaded={!degreesLoading} className="w-full inline-block max-w-96">
            <p className="text-sm">{formatDate(createdAt)}</p>
          </Skeleton>
        </div>
        <div className="w-fit py-4">
          <Button 
            color="default" 
            onClick={handleSignOut} 
            className="bg-prussian-blue fit-content" 
            startContent={<LogoutIcon style={{ width: '20px' }}/>}
            style={{ color: 'var(--background-hex)' }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePageClient;