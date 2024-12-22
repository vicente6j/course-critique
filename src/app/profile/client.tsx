'use client'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Button, SharedSelection, Spinner } from "@nextui-org/react";
import LogoutIcon from '@mui/icons-material/Logout';
import { Input } from "@nextui-org/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { SearchIcon } from "../../../public/icons/searchIcon";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { useProfile } from "../contexts/profile/provider";
import { useDegreePrograms } from "../contexts/degree-programs/provider";
import { DegreeProgram } from "../api/degree-programs";
import { updateProfileField } from "../api/profile";
import ProfileDropdown from "./dropdown";

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

export const formatDate: (timestamp: string) => string = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date);
}

export interface ProfilePageClientProps {}

const ProfilePageClient: FC<ProfilePageClientProps> = ({

}: ProfilePageClientProps) => {

  const { profile, refetchProfile } = useProfile();

  const [selectedYear, setSelectedYear] = useState<string>('Select a year');
  const [selectedDegreeProgram, setSelectedDegreeProgram] = useState<string>('');
  const [selectedSecondaryDegreeProgram, setSelectedSecondaryDegreeProgram] = useState<string[]>(['']);
  const [selectedMinorProgram, setSelectedMinorProgram] = useState<string[]>(['']);
  const [level, setLevel] = useState<string>('Not specified');
  const [searchValue, setSearchValue] = useState<string>('');

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { degreePrograms, degreeProgramMap } = useDegreePrograms();

  const checkLevel: (program: DegreeProgram) => string = useCallback((program: DegreeProgram) => {
    return program.id.includes('-bs') ? 'Undergraduate' : 'Graduate';
  }, []);

  // const fetchFromProfile: () => void = useCallback(async () => {
  //   if (!profile || !degreeProgramMap) {
  //     return;
  //   }
  //   const year = profile.year;

  //   const degree = profile.degree_program;
  //   if (degree && degreeProgramMap.has(degree)) {
  //     setSelectedDegreeProgram([degree]);
  //     setLevel(checkLevel(degreeProgramMap.get(degree)!));
  //   }
  //   const secondaryDegree = profile.secondary_degree_program;
  //   if (secondaryDegree && degreeProgramMap.has(secondaryDegree)) {
  //     setSelectedSecondaryDegreeProgram([secondaryDegree]);
  //   }
  //   const minor = profile.minor_program;
  //   if (minor && degreeProgramMap.has(minor)) {
  //     setSelectedMinorProgram([minor]);
  //   }
  // }, [profile, degreePrograms, degreeProgramMap]);

  // useEffect(() => {
  //   fetchFromProfile();
  // }, [fetchFromProfile]); 

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);
  
  const nonMinorItems: DegreeProgram[] = useMemo(() => {
    if (!degreePrograms) {
      return [];
    }
    return degreePrograms.filter((degreeProgram: DegreeProgram) => {
      return !degreeProgram.id.includes('minor');
    });
  }, [degreePrograms]);

  const filteredDegreeProgramItems: DropdownMenuItem[] = useMemo(() => {
    if (!nonMinorItems) {
      return [];
    }
    let filteredPrograms: DegreeProgram[] = [];
    if (searchValue && searchValue !== '') {
      const tokens: string[] = searchValue.split(' ');
      if (tokens.length <= 2) {
        filteredPrograms = nonMinorItems.filter((item: DegreeProgram) => {
          return item.name.toLowerCase().includes(searchValue);
        });
      } else {
        /** 
         * If we compute that the number of tokens is larger than 2,
         * ensure that every token is present (without regard to order),
         * AND that the first two tokens are present as is.
         */
        const firstTwoTokens = searchValue.substring(0, searchValue.indexOf(' ', searchValue.indexOf(' ') + 1));
        filteredPrograms = nonMinorItems.filter((item: DegreeProgram) => {
          return tokens.every(token => item.name.toLowerCase().includes(token)) && item.name.toLowerCase().includes(firstTwoTokens);
        });
      }
    } else {
      filteredPrograms = nonMinorItems;
    }
    return [
      ...(filteredPrograms!.map((program: DegreeProgram) => {
        return { key: program.id, label: program.name };
      }) || [])
    ];
  }, [nonMinorItems, searchValue]);

  const minorItems: DegreeProgram[] = useMemo(() => {
    if (!degreePrograms) {
      return [];
    }
    return degreePrograms.filter((degreeProgram: DegreeProgram) => {
      return degreeProgram.id.includes('minor');
    });
  }, [degreePrograms]);

  const filteredMinorItems: DropdownMenuItem[] = useMemo(() => {
    if (!minorItems) {
      return [];
    }
    const filteredMinors = minorItems.filter((item: DegreeProgram) => {
      return item.name.toLowerCase().includes(searchValue);
    });
    return [
      { key: '', label: 'Select a minor program' },
      ...(filteredMinors!.map((program: DegreeProgram) => {
        return { key: program.id, label: program.name };
      }) || [])
    ];
  }, [minorItems, searchValue]);

  const handleSignOut: () => Promise<void> = useCallback(async () => {
    await signOut({
      redirect: true,
      callbackUrl: '/',
    });
  }, []);

  const onSearchChange: (value: string) => void = useCallback((value: string) => {
    setSearchValue(value || '');
  }, []);

  const onClear: () => void = useCallback(() => {
    setSearchValue('');
  }, []);

  const handleYearChange: (year: string | number) => void = useCallback(async (year) => {
    setSelectedYear(String(year));
    if (year === 'Select a year') {
      return;
    }
    const numericalYear = Number(year);
    // await updateProfileField('year', numericalYear, profile!.id);
    // await refetchProfile();
  }, [profile!.id]);

  /**
   * Supports updating the degree program as well as the level of the user
   * (i.e. undergraduate or graduate).
   */
  const handleDegreeProgramChange: (program: DegreeProgram) => void = useCallback(async (program) => {
    setSelectedDegreeProgram(program.name);
    const level = program.id !== '' ? checkLevel(degreeProgramMap?.get(program.id)!) : 'Not specified';
    setLevel(level); 
    // await updateProfileField('degree_program', selected[0], profile!.id);
    // await updateProfileField('level', level, profile!.id);
    // await refetchProfile();
  }, [degreeProgramMap]);

  const handleSecondaryDegreeProgramChange: (keys: SharedSelection) => void = useCallback(async (keys) => {
    const selected = Array.from(keys as Set<string>);
    setSelectedSecondaryDegreeProgram(selected);
  
    await updateProfileField('secondary_degree_program', selected[0], profile!.id);
    await refetchProfile();
  }, [profile?.id]);

  const handleMinorProgramChange: (keys: SharedSelection) => void = useCallback(async (keys) => {
    const selected = Array.from(keys as Set<string>);
    setSelectedMinorProgram(selected);
  
    await updateProfileField('minor_program', selected[0], profile!.id);
    await refetchProfile();
  }, [profile?.id]);

  const yearOptions: Array<{ 
    label: string;
    onClick: () => void;
  }> = useMemo(() => {
    return ['Select a year', 1, 2, 3, 4].map((year, idx) => (
      {
        label: String(year),
        onClick: () => {
          handleYearChange(year);
        }
      }
    ))
  }, []);

  const filterDegreePrograms: (searchValue: string) => any[] = useCallback((searchValue) => {
    if (!nonMinorItems) {
      return [];
    }
    let filteredItems: DegreeProgram[] = [];
    if (searchValue && searchValue !== '') {
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
      filteredItems = nonMinorItems;
    }
    return filteredItems.map((program: DegreeProgram, idx) => (
      {
        label: program.name,
        onClick: () => {
          handleDegreeProgramChange(program);
        }
      }
    ));
  }, [nonMinorItems]);

  const degreeProgramOptions: Array<{ 
    label: string;
    onClick: () => void;
  }> = useMemo(() => {
    return nonMinorItems.map((program: DegreeProgram, idx) => (
      {
        label: program.name,
        onClick: () => {
          handleDegreeProgramChange(program);
        }
      }
    ));
  }, [nonMinorItems]);

  return (
    <div className="flex-grow w-4/5 mx-auto">
      <div className="my-8 p-8 rounded bg-white flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="heading-md">{profile?.name}</h1>
          <p className="text-md text-gray-400">Signed in with {profile?.provider} ({profile?.email})</p>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-10 text-md items-center">
          <p className="text-md">Year</p>
          <ProfileDropdown 
            options={yearOptions}
            text={selectedYear === 'Select a year' ? 'Select a year' : `${suffixDict[parseInt(selectedYear)]} year`}
            selectedOption={selectedYear}
          />

          <div className="flex flex-row gap-2">
            <p className="text-md">Level</p>
            <NextToolTip content={'Inferred from your primary degree program.'}>
              <InfoIcon style={{ width: '18px' }} />
            </NextToolTip>
          </div>
          <p className="text-sm">{level}</p>

          <p className="text-md">Degree Program</p>
          <ProfileDropdown 
            options={degreeProgramOptions}
            text={selectedDegreeProgram === '' ? 'Select a degree program' : selectedDegreeProgram}
            selectedOption={selectedDegreeProgram}
            containsSearch={true}
            searchString={'Search for a degree program...'}
            filterOptions={filterDegreePrograms}
          />

          <div className="flex flex-row gap-2">
            <p className="text-md">Secondary degree program</p>
            <NextToolTip content={'This is optional, if you want to add a double major for e.g.'}>
              <InfoIcon style={{ width: '20px' }} />
            </NextToolTip>
          </div>
          

          <div className="flex flex-row gap-2">
            <p className="text-md">Minor</p>
            <NextToolTip content={'This is also optional, don\'t need a minor unless you want it'}>
              <InfoIcon style={{ width: '20px' }} />
            </NextToolTip>
          </div>
        </div>
        <div className="w-fit py-4">
          <Button 
            color="default" 
            onClick={handleSignOut} 
            className="bg-prussian-blue fit-content" 
            startContent={<LogoutIcon />}
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