'use client'
import { redirect } from "next/navigation";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authConfig";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { Footer } from "@/app/shared/footer";
import Navbar from "@/app/shared/navbar";
import { Button, DropdownSection, Link, SharedSelection, Spinner } from "@nextui-org/react";
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import { Input } from "@nextui-org/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { SearchIcon } from "../../../public/icons/searchIcon";
import { Tooltip as NextToolTip } from "@nextui-org/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { useProfile } from "../contexts/profile/provider";
import { updateField } from "../api/profile";
import { useDegreePrograms } from "../contexts/degree-programs/provider";
import { DegreeProgram } from "../api/degree-programs";

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

  const [selectedYear, setSelectedYear] = useState<string[]>(['Select a year']);
  const [selectedDegreeProgram, setSelectedDegreeProgram] = useState<string[]>(['']);
  const [selectedSecondaryDegreeProgram, setSelectedSecondaryDegreeProgram] = useState<string[]>(['']);
  const [selectedMinorProgram, setSelectedMinorProgram] = useState<string[]>(['']);
  const [level, setLevel] = useState<string>('Not specified');
  const [searchValue, setSearchValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { degreePrograms, degreeProgramMap } = useDegreePrograms();
  const { profile, refetchProfile } = useProfile();

  const checkLevel: (program: DegreeProgram) => string = useCallback((program: DegreeProgram) => {
    return program.id.includes('-bs') ? 'Undergraduate' : 'Graduate';
  }, []);

  const fetchFromProfile: () => void = useCallback(async () => {
    if (!profile || !degreeProgramMap) {
      return;
    }
    const year = profile.year;
    if (year) {
      setSelectedYear([`${suffixDict[year]} year`])
    }
    const degree = profile.degree_program;
    if (degree && degreeProgramMap.has(degree)) {
      setSelectedDegreeProgram([degree]);
      setLevel(checkLevel(degreeProgramMap.get(degree)!));
    }
    const secondaryDegree = profile.secondary_degree_program;
    if (secondaryDegree && degreeProgramMap.has(secondaryDegree)) {
      setSelectedSecondaryDegreeProgram([secondaryDegree]);
    }
    const minor = profile.minor_program;
    if (minor && degreeProgramMap.has(minor)) {
      setSelectedMinorProgram([minor]);
    }
  }, [profile, degreePrograms, degreeProgramMap]);

  useEffect(() => {
    fetchFromProfile();
  }, [fetchFromProfile]); 

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

  const handleYearChange: (keys: SharedSelection) => void = useCallback(async (keys) => {
    const selected = Array.from(keys as Set<string>);
    setSelectedYear(selected);

    const numericalYear = Number(selected[0].charAt(0));
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  
    debounceTimeout.current = setTimeout(async () => {
      await updateField('year', numericalYear, profile!.id);
      await refetchProfile();
    }, 500);
  }, [profile?.id]);

  /**
   * Supports updating the degree program as well as the level of the user
   * (i.e. undergraduate or graduate).
   */
  const handleDegreeProgramChange: (keys: SharedSelection) => void = useCallback(async (keys) => {
    const selected = Array.from(keys as Set<string>);
    setSelectedDegreeProgram(selected);
    setSearchValue('');
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    const level = selected[0] !== '' ? checkLevel(degreeProgramMap?.get(selected[0])!) : 'Not specified';
    setLevel(level); 
    debounceTimeout.current = setTimeout(async () => {
      await updateField('degree_program', selected[0], profile!.id);
      await updateField('level', level, profile!.id);
      await refetchProfile();
    }, 500);
  }, [profile?.id]);

  const handleSecondaryDegreeProgramChange: (keys: SharedSelection) => void = useCallback(async (keys) => {
    const selected = Array.from(keys as Set<string>);
    setSelectedSecondaryDegreeProgram(selected);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  
    debounceTimeout.current = setTimeout(async () => {
      await updateField('secondary_degree_program', selected[0], profile!.id);
      await refetchProfile();
    }, 500);
  }, [profile?.id]);

  const handleMinorProgramChange: (keys: SharedSelection) => void = useCallback(async (keys) => {
    const selected = Array.from(keys as Set<string>);
    setSelectedMinorProgram(selected);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  
    debounceTimeout.current = setTimeout(async () => {
      await updateField('minor_program', selected[0], profile!.id);
      await refetchProfile();
    }, 500);
  }, [profile?.id]);

  const searchbar: React.ReactNode = useMemo(() => {
    return (
      <div className="py-1 sticky top-0 bg-white z-10">
        <Input
          isClearable
          variant="bordered"
          classNames={{
            inputWrapper: "border-1 border-t-0 border-r-0 border-l-0 rounded-none data-[hover=true]:border-default-200 group-data-[focus=true]:border-default-200",
          }}
          placeholder="Search for a degree program..."
          startContent={<SearchIcon />}
          value={searchValue}
          onClear={onClear}
          onValueChange={onSearchChange}
        />
      </div>
    )
  }, [searchValue, onSearchChange, onClear]);

  return (
    <div className="flex-grow w-4/5 mx-auto">
      {!profile ? (
        <Spinner />
      ) : (
        <div className="my-8 p-8 rounded bg-white flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="heading-md">{profile?.name}</h1>
            <p className="text-md text-gray-400">Signed in with {profile?.provider} ({profile?.email})</p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-y-4 gap-x-10 text-md items-center">
            <p className="text-md">Year</p>
            <Dropdown 
              closeOnSelect={true}
              classNames={{
                content: "p-0 rounded-none"
              }}
            >
              <DropdownTrigger>
                <Button
                  disableAnimation
                  disableRipple
                  variant="bordered"
                  color="default"
                  radius="sm"
                  className={`
                    ${selectedYear[0] === 'Select a year' ? 'text-gray-400' : ''} 
                    w-fit border-1 aria-expanded:scale-100
                  `}
                  endContent={<ArrowDropDownIcon />}
                >
                  {selectedYear[0]}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="year-options" 
                variant="flat"
                disableAnimation={true}
                items={yearItems}
                selectionMode="single"
                selectedKeys={selectedYear}
                onSelectionChange={handleYearChange}
                classNames={{
                  base: "p-0",
                }}
              >
                {(item) => (
                  <DropdownItem
                    key={item.key}
                    className="rounded-none py-2"
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>

            <div className="flex flex-row gap-2">
              <p className="text-md">Level</p>
              <NextToolTip content={'Inferred from your primary degree program'}>
                <InfoIcon style={{ width: '20px' }} />
              </NextToolTip>
            </div>
            <p className="text-sm">{level}</p>

            <p className="text-md">Degree program</p>
            <Dropdown 
              closeOnSelect={true}
              classNames={{
                content: "p-0 rounded-none"
              }}
              onClose={onClear}
            >
              <DropdownTrigger>
                <Button
                  disableAnimation={true}
                  disableRipple={true}
                  variant="bordered"
                  color="default"
                  radius="sm"
                  className={`${selectedDegreeProgram[0] === '' ? 'text-gray-400' : ''} 
                    w-fit border-1 aria-expanded:scale-100
                  `}
                  endContent={<ArrowDropDownIcon />}
                >
                  {selectedDegreeProgram[0] !== '' 
                    ? degreeProgramMap!.get(selectedDegreeProgram[0])?.name! 
                    : 'Select a degree program'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="primary-degree-options" 
                variant="flat"
                disableAnimation={true}
                items={[{ key: '', label: 'Select a degree program '}, ...filteredDegreeProgramItems]}
                selectionMode="single"
                selectedKeys={selectedDegreeProgram}
                onSelectionChange={handleDegreeProgramChange}
                topContent={searchbar}
                className="h-300 w-300 overflow-y-auto"
                classNames={{
                  base: "p-0",
                  list: ""
                }}
              >
                {(item) => (
                  <DropdownItem
                    key={item.key}
                    className="rounded-none py-2"
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>

            <div className="flex flex-row gap-2">
              <p className="text-md">Secondary degree program</p>
              <NextToolTip content={'This is optional, if you want to add a double major for e.g.'}>
                <InfoIcon style={{ width: '20px' }} />
              </NextToolTip>
            </div>
            <Dropdown 
              closeOnSelect={true}
              classNames={{
                content: "p-0 rounded-none"
              }}
              onClose={onClear}
            >
              <DropdownTrigger>
                <Button
                  disableAnimation={true}
                  disableRipple={true}
                  variant="bordered"
                  color="default"
                  radius="sm"
                  className={`${selectedSecondaryDegreeProgram[0] === '' ? 'text-gray-400' : ''} 
                    w-fit border-1 aria-expanded:scale-100
                  `}
                  endContent={<ArrowDropDownIcon />}
                >
                  {selectedSecondaryDegreeProgram[0] !== '' 
                    ? degreeProgramMap!.get(selectedSecondaryDegreeProgram[0])?.name! 
                    : 'Select a secondary degree program'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="secondary-degree-options" 
                variant="flat"
                disableAnimation={true}
                items={[{ key: '', label: 'Select a secondary degree program '}, ...filteredDegreeProgramItems]}
                selectionMode="single"
                selectedKeys={selectedSecondaryDegreeProgram}
                onSelectionChange={handleSecondaryDegreeProgramChange}
                topContent={searchbar}
                className="h-250 w-300 overflow-y-auto"
                classNames={{
                  base: "p-0",
                }}
              >
                {(item) => (
                  <DropdownItem
                    key={item.key}
                    className="rounded-none py-2"
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>

            <div className="flex flex-row gap-2">
              <p className="text-md">Minor</p>
              <NextToolTip content={'This is also optional, don\'t need a minor unless you want it'}>
                <InfoIcon style={{ width: '20px' }} />
              </NextToolTip>
            </div>
            <Dropdown 
              closeOnSelect={true}
              classNames={{
                content: "p-0 rounded-none"
              }}
            >
              <DropdownTrigger>
                <Button
                  disableAnimation={true}
                  disableRipple={true}
                  variant="bordered"
                  color="default"
                  radius="sm"
                  className={`${selectedMinorProgram[0] === '' ? 'text-gray-400' : ''} 
                    w-fit border-1 aria-expanded:scale-100
                  `}
                  endContent={<ArrowDropDownIcon />}
                >
                  {selectedMinorProgram[0] !== '' 
                    ? degreeProgramMap!.get(selectedMinorProgram[0])?.name! 
                    : 'Select a minor'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="minor-options" 
                variant="flat"
                disableAnimation={true}
                items={filteredMinorItems}
                selectionMode="single"
                selectedKeys={selectedMinorProgram}
                onSelectionChange={handleMinorProgramChange}
                topContent={searchbar}
                className="h-250 w-300 overflow-y-auto"
                classNames={{
                  base: "p-0",
                }}
              >
                {(item) => (
                  <DropdownItem
                    key={item.key}
                    className="rounded-none py-2"
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>

            <p className="text-md">Created</p>
            <p className="text-sm">{formatDate(profile.created_at)}</p>
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
      )}
    </div>
  );
}

export default ProfilePageClient;